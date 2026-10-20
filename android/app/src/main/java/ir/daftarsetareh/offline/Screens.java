package ir.daftarsetareh.offline;

import android.graphics.*;
import android.view.*;
import android.widget.*;
import org.json.*;
import java.time.LocalDate;
import java.util.*;

/** The native presentation layer: persistent state is always read from Store. */
final class Screens {
    final MainActivity a;final Ui ui;final Store db;final Forms forms;int reportsLimit=30,examsLimit=30;
    Screens(MainActivity activity){a=activity;ui=a.ui;db=a.store;forms=a.forms;}
    void title(LinearLayout box,String title,String subtitle){ui.add(box,ui.text(title,25,Ui.INK));ui.space(box,5);ui.add(box,ui.text(subtitle,13,Ui.MUTED));ui.space(box,12);}
    void heading(LinearLayout box,String title){ui.space(box,12);ui.add(box,ui.label(title));ui.space(box,7);}
    List<JSONObject> sorted(String collection,boolean ascending){List<JSONObject> values=db.all(collection);values.sort(Comparator.comparing(item->item.optString("date")+item.optString("time")));if(!ascending)Collections.reverse(values);return values;}
    String grade(Double value){return Dates.decimal(value==null?null:value*db.profile().optDouble("scale",20)/100)+" از "+Dates.fa(db.profile().optDouble("scale",20));}
    void remove(String collection,JSONObject value){ui.confirm("حذف این مورد؟","این رکورد از دفتر همین گوشی حذف می‌شود. بقیهٔ اطلاعات حفظ می‌شود.",()->{db.remove(collection,value.optString("id"));a.refresh();});}
    void persistCheck(CheckBox checkbox,String collection,JSONObject record,JSONObject value){boolean[] reverting={false};checkbox.setOnCheckedChangeListener((button,checked)->{if(reverting[0])return;boolean previous=value.optBoolean("completed");try{value.put("completed",checked);db.save(collection,record);}catch(Exception error){try{value.put("completed",previous);}catch(JSONException ignored){}reverting[0]=true;checkbox.setChecked(previous);reverting[0]=false;ui.toast("تغییر ذخیره نشد؛ وضعیت قبلی حفظ شد. "+error.getMessage());}});}
    void home(LinearLayout box){
        String today=Dates.today();JSONObject profile=db.profile();
        title(box,"امروز، "+profile.optString("name"),Dates.format(today));
        int minutes=db.totalMinutes(today,today),goal=profile.optInt("dailyGoal",90);
        LinearLayout todayCard=ui.card(box);
        ui.add(todayCard,ui.text("مطالعهٔ امروز",14,Ui.MUTED));
        ui.space(todayCard,6);ui.add(todayCard,ui.text(Dates.fa(minutes)+" دقیقه",34,Ui.INK));
        ui.progress(todayCard,minutes,goal);
        ui.add(todayCard,ui.text(minutes>=goal?"هدف امروز کامل شد. آفرین!":"از هدف "+Dates.fa(goal)+" دقیقه‌ای امروز",13,Ui.MUTED));
        ui.space(todayCard,16);ui.add(todayCard,ui.button("ثبت مطالعه",true,()->forms.report(null)));

        heading(box,"برنامهٔ امروز");
        List<JSONObject> todaySessions=new ArrayList<>();
        for(JSONObject session:sorted("sessions",true))if(today.equals(session.optString("date")))todaySessions.add(session);
        if(todaySessions.isEmpty()){
            LinearLayout empty=ui.card(box);ui.add(empty,ui.label("با یک قدم کوچک شروع کن"));
            ui.space(empty,6);ui.add(empty,ui.text("یک زمان کوتاه برای درس بعدی کنار بگذار.",14,Ui.MUTED));
            ui.space(empty,12);ui.add(empty,ui.button("افزودن به برنامه",false,()->forms.session(null)));
        }else{
            for(JSONObject session:todaySessions.subList(0,Math.min(2,todaySessions.size())))sessionCard(box,session);
            ui.add(box,ui.button("همهٔ برنامه‌ها",false,()->a.navigate("planner")));
        }

        String[] week=Dates.period(today,"weekly");
        heading(box,"این هفته");
        LinearLayout weekCard=ui.card(box);
        ui.stat(weekCard,"مجموع مطالعه",Dates.fa(db.totalMinutes(week[0],week[1]))+" دقیقه");
        StudyChart chart=new StudyChart(a,week[0]);weekCard.addView(chart,new LinearLayout.LayoutParams(-1,ui.dp(120)));
        ui.space(weekCard,10);ui.add(weekCard,ui.text(Dates.fa(streak(today))+" روز پیوسته مطالعه • میانگین "+grade(db.average("1921-01-01","2122-12-31")),13,Ui.MUTED));
    }
    int streak(String today){Set<String> days=new HashSet<>();for(JSONObject report:db.all("reports"))if(Store.minutes(report)>0)days.add(report.optString("date"));LocalDate cursor=LocalDate.parse(today);if(!days.contains(today))cursor=cursor.minusDays(1);int result=0;while(days.contains(cursor.toString())){result++;cursor=cursor.minusDays(1);}return result;}
    void reports(LinearLayout box){
        title(box,"مطالعه‌های من","زمان مطالعه و یادداشت‌های روزانه، در یک جا.");
        ui.add(box,ui.button("ثبت مطالعه",true,()->forms.report(null)));
        List<JSONObject> reports=sorted("reports",false);
        if(reports.isEmpty()){ui.empty(box,"اولین مطالعه‌ات را ثبت کن","درس و زمان مطالعه کافی است. یادداشت و کارها اختیاری‌اند.");return;}
        for(JSONObject report:reports.subList(0,Math.min(reportsLimit,reports.size()))){
            LinearLayout card=ui.card(box);
            ui.recordHeading(card,Dates.format(report.optString("date")),Dates.fa(Store.minutes(report))+" دقیقه مطالعه",
                    new String[]{"ویرایش مطالعه","حذف مطالعه"},new Runnable[]{()->forms.report(report),()->remove("reports",report)});
            JSONArray rows=report.optJSONArray("subjects");
            for(int i=0;i<rows.length();i++){JSONObject row=rows.optJSONObject(i);ui.stat(card,db.subjectName(row.optString("subjectId")),Dates.fa(row.optInt("minutes"))+" دقیقه");}
            JSONArray tasks=report.optJSONArray("tasks");
            for(int i=0;i<tasks.length();i++){JSONObject task=tasks.optJSONObject(i);CheckBox checkbox=new CheckBox(a);checkbox.setText(task.optString("title"));checkbox.setTypeface(ui.font);checkbox.setTextColor(Ui.INK);checkbox.setMinHeight(ui.dp(48));checkbox.setChecked(task.optBoolean("completed"));persistCheck(checkbox,"reports",report,task);ui.add(card,checkbox);}
            String[] fields={"lessons","exercises","difficulties","reflection","nextGoals"},labels={"مرور درس","تمرین‌ها","چالش امروز","یادداشت امروز","قدم بعدی"};
            LinearLayout notes=ui.column();int noteCount=0;
            for(int i=0;i<fields.length;i++)if(!report.optString(fields[i]).isEmpty()){ui.space(notes,8);ui.add(notes,ui.label(labels[i]));ui.add(notes,ui.text(report.optString(fields[i]),14,Ui.INK));noteCount++;}
            if(noteCount>0)ui.disclosure(card,"یادداشت‌های این روز",notes,false);
        }
        if(reports.size()>reportsLimit)ui.add(box,ui.button("نمایش مطالعه‌های بیشتر",false,()->{reportsLimit+=30;a.refresh();}));
    }
    void exams(LinearLayout box){
        title(box,"نمره‌ها و آزمون‌ها","آزمون آینده را هم می‌توانی بدون نمره ثبت کنی.");
        ui.add(box,ui.button("افزودن آزمون",true,()->forms.exam(null)));
        LinearLayout summary=ui.card(box);ui.stat(summary,"میانگین کل",grade(db.average("1921-01-01","2122-12-31")));
        LinearLayout details=ui.column();
        for(Map.Entry<String,Double> row:db.subjectAverages("1921-01-01","2122-12-31").entrySet())if(row.getValue()!=null)ui.stat(details,db.subjectName(row.getKey()),grade(row.getValue()));
        ui.add(details,ui.text("درس‌های نمره‌دار سهم برابر دارند. ضریب آزمون در میانگین همان درس اثر دارد. نمرهٔ خالی حساب نمی‌شود؛ صفر حساب می‌شود.",12,Ui.MUTED));
        ui.disclosure(summary,"میانگین درس‌ها و روش محاسبه",details,false);
        List<JSONObject> exams=sorted("exams",false);
        if(exams.isEmpty())ui.empty(box,"هنوز آزمونی نداری","با ثبت نام درس و تاریخ آزمون شروع کن.");
        for(JSONObject exam:exams.subList(0,Math.min(examsLimit,exams.size()))){
            LinearLayout card=ui.card(box);
            ui.recordHeading(card,exam.optString("title"),db.subjectName(exam.optString("subjectId"))+" • "+Dates.format(exam.optString("date")),
                    new String[]{"ویرایش آزمون","حذف آزمون"},new Runnable[]{()->forms.exam(exam),()->remove("exams",exam)});
            ui.space(card,10);ui.add(card,ui.text(exam.isNull("grade")?"در انتظار نمره":Dates.fa(exam.optDouble("grade"))+" از "+Dates.fa(exam.optDouble("maxGrade")),24,exam.isNull("grade")?Ui.GOLD:Ui.ACCENT));
            if(!exam.isNull("weight")&&exam.optDouble("weight")!=1)ui.add(card,ui.text("ضریب "+Dates.fa(exam.optDouble("weight")),12,Ui.MUTED));
            if(!exam.optString("notes").isEmpty()){ui.space(card,6);ui.add(card,ui.text(exam.optString("notes"),14,Ui.MUTED));}
        }
        if(exams.size()>examsLimit)ui.add(box,ui.button("نمایش آزمون‌های بیشتر",false,()->{examsLimit+=30;a.refresh();}));
    }
    void range(LinearLayout box,String kind){Button date=ui.button(Dates.format(a.referenceDate),false,()->{});date.setTag(a.referenceDate);date.setOnClickListener(view->ui.pickDate(date,iso->{a.referenceDate=iso;a.refresh();}));ui.add(box,date);String[] period=Dates.period(a.referenceDate,kind);ui.space(box,8);ui.add(box,ui.text(Dates.format(period[0])+" تا "+Dates.format(period[1]),12,Ui.MUTED));ui.buttons(box,"← دورهٔ بعد",()->{a.referenceDate=shift(period[0],kind,1);a.refresh();},"دورهٔ قبل →",()->{a.referenceDate=shift(period[0],kind,-1);a.refresh();});}
    String shift(String date,String kind,int direction){if(kind.equals("weekly"))return LocalDate.parse(date).plusDays(direction*7L).toString();int[] j=Dates.jalali(date);int month=j[1]+direction,year=j[0];if(month==13){month=1;year++;}if(month==0){month=12;year--;}return Dates.iso(year,month,1);}
    void planner(LinearLayout box){title(box,"برنامه","برای هر درس، یک زمان مشخص.");ui.add(box,ui.button("افزودن برنامه",true,()->forms.session(null)));ui.space(box,12);range(box,"weekly");String[] period=Dates.period(a.referenceDate,"weekly");int count=0;for(JSONObject session:sorted("sessions",true))if(Core.inRange(session.optString("date"),period[0],period[1])){sessionCard(box,session);count++;}if(count==0)ui.empty(box,"این هفته هنوز برنامه‌ای ندارد","یک جلسه یا یک مجموعهٔ تکرارشونده بساز. روزهای هفته و پایان تکرار قابل انتخاب‌اند.");}
    void sessionCard(LinearLayout box,JSONObject session){
        LinearLayout card=ui.card(box),row=ui.row(),copy=ui.column();
        List<String> options=new ArrayList<>(Arrays.asList("ویرایش جلسه","حذف جلسه"));
        List<Runnable> actions=new ArrayList<>(Arrays.asList(()->forms.session(session),()->remove("sessions",session)));
        if(!session.optString("seriesId").isEmpty()){
            options.add("حذف مجموعهٔ تکرار");
            actions.add(()->ui.confirm("حذف مجموعهٔ تکرار؟","همهٔ جلسه‌های این مجموعه حذف می‌شوند. گزارش‌های مطالعه حفظ می‌شوند.",()->{db.removeSeries(session.optString("seriesId"));a.refresh();}));
        }
        CheckBox done=new CheckBox(a);done.setText(session.optString("title"));done.setTypeface(ui.font);done.setTextSize(16);done.setTextColor(Ui.INK);done.setMinHeight(ui.dp(48));done.setChecked(session.optBoolean("completed"));persistCheck(done,"sessions",session,session);ui.add(copy,done);
        String subject=session.optString("subjectId").isEmpty()?session.optString("kind"):db.subjectName(session.optString("subjectId"));
        ui.add(copy,ui.text(Dates.fa(session.optString("time"))+" • "+Dates.fa(session.optInt("duration"))+" دقیقه • "+subject,13,Ui.MUTED));
        if(!a.screen.equals("home"))ui.add(copy,ui.text(Dates.format(session.optString("date")),12,Ui.MUTED));
        row.addView(copy,new LinearLayout.LayoutParams(0,-2,1));
        row.addView(ui.overflow(session.optString("title"),options.toArray(new String[0]),actions.toArray(new Runnable[0])),new LinearLayout.LayoutParams(ui.dp(48),ui.dp(48)));ui.add(card,row);
        if(!session.optString("notes").isEmpty()){ui.space(card,6);ui.add(card,ui.text(session.optString("notes"),13,Ui.MUTED));}
    }
    void goals(LinearLayout box){
        title(box,"هدف‌های من","یک هدف کوچک برای قدم بعدی.");
        ui.add(box,ui.button("افزودن هدف",true,()->forms.goal(null)));
        List<JSONObject> goals=db.all("goals");
        if(goals.isEmpty())ui.empty(box,"یک هدف کوچک انتخاب کن","مطالعه، انجام کارها یا میانگین نمره.");
        for(JSONObject goal:goals){
            LinearLayout card=ui.card(box);double current=db.goalValue(goal,Dates.today()),target=goal.optDouble("target");int percent=(int)Math.min(100,Math.round(current*100/target));
            String period=goal.optString("period").equals("daily")?"روزانه":goal.optString("period").equals("weekly")?"هفتگی":"ماهانه";
            String unit=goal.optString("metric").equals("minutes")?"دقیقه":goal.optString("metric").equals("tasks")?"کار":"درصد";
            ui.recordHeading(card,goal.optString("title"),period+" • "+(goal.optBoolean("active")?"فعال":"متوقف"),new String[]{"ویرایش هدف","حذف هدف"},new Runnable[]{()->forms.goal(goal),()->remove("goals",goal)});
            ui.progress(card,current,target);ui.stat(card,Dates.decimal(current)+" از "+Dates.decimal(target)+" "+unit,Dates.fa(percent)+"٪");
            LinearLayout details=ui.column();ui.space(details,10);ui.add(details,ui.text("از "+Dates.format(goal.optString("start"))+" تا "+Dates.format(goal.optString("end")),12,Ui.MUTED));
            String milestones="";for(int step:new int[]{25,50,75,100})milestones+=(percent>=step?"✦":"☆")+" "+Dates.fa(step)+"٪   ";ui.add(details,ui.text(milestones,12,Ui.GOLD));
            ui.disclosure(card,"جزئیات هدف",details,false);
        }
    }
    void cards(LinearLayout box){
        title(box,"کارنامه","پیشرفتت را مرور کن و خروجی بگیر.");
        LinearLayout periods=ui.row();String[] ids={"weekly","monthly"},labels={"هفتگی","ماهانه"};
        for(int i=0;i<ids.length;i++){final String id=ids[i];boolean selected=id.equals(a.cardPeriod);Button button=ui.button(labels[i],selected,()->{a.cardPeriod=id;a.refresh();});button.setSelected(selected);button.setContentDescription(labels[i]+(selected?"، انتخاب‌شده":""));LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(0,-2,1);params.setMargins(ui.dp(4),0,ui.dp(4),0);periods.addView(button,params);}
        ui.add(box,periods);ui.space(box,8);range(box,a.cardPeriod);
        ReportData report=new ReportData(db,a.referenceDate,a.cardPeriod);LinearLayout summary=ui.card(box);
        ui.add(summary,ui.label(report.title));ui.space(summary,12);
        ui.stat(summary,"مطالعه",Dates.fa(report.minutes)+" دقیقه");
        ui.stat(summary,"میانگین",grade(report.average));
        ui.stat(summary,"برنامه‌های انجام‌شده",Dates.fa(report.completed)+" از "+Dates.fa(report.total));
        ui.space(box,12);ui.add(box,ui.button("ذخیرهٔ PDF کارنامه",true,()->a.exporter.pdf(report)));
        ui.buttons(box,"چاپ",()->a.exporter.print(report),"اشتراک متن",()->a.exporter.shareText(report));
        LinearLayout details=ui.column();for(String line:report.lines){ui.add(details,ui.text(line,14,Ui.INK));ui.space(details,12);}
        ui.disclosure(box,"متن کامل کارنامه",details,false);
    }
    void subjects(LinearLayout box){
        title(box,"درس‌ها","درس‌هایت را اضافه یا مرتب کن.");
        ui.add(box,ui.button("افزودن درس",true,()->forms.subject(null)));
        if(db.all("subjects").isEmpty())ui.empty(box,"هنوز درسی نداری","برای ثبت مطالعه و آزمون، یک درس اضافه کن.");
        for(JSONObject subject:db.all("subjects")){
            LinearLayout card=ui.card(box);
            Runnable archive=()->{try{subject.put("archived",!subject.optBoolean("archived"));db.save("subjects",subject);a.refresh();}catch(JSONException error){throw new IllegalStateException(error);}};
            ui.recordHeading(card,subject.optString("name"),subject.optBoolean("archived")?"بایگانی‌شده":"فعال",new String[]{"ویرایش درس",subject.optBoolean("archived")?"بازگردانی درس":"بایگانی درس"},new Runnable[]{()->forms.subject(subject),archive});
            android.graphics.drawable.GradientDrawable outline=ui.surface(Color.WHITE,16);outline.setStroke(ui.dp(1),Color.parseColor(subject.optString("color")));card.setBackground(outline);
        }
    }
    void more(LinearLayout box){
        title(box,"بیشتر","ابزارهای پیشرفت و نگهداری دفتر.");
        menu(box,"کارنامه","مرور هفتگی و ماهانه، PDF و چاپ","cards");
        menu(box,"هدف‌های من","هدف‌های مطالعه و پیشرفت","goals");
        menu(box,"درس‌ها","افزودن و مرتب‌کردن درس‌ها","subjects");
        menu(box,"تنظیمات و پشتیبان","پروفایل، ذخیره و بازیابی دفتر","settings");
    }
    void menu(LinearLayout box,String title,String subtitle,String target){
        LinearLayout card=ui.card(box),row=ui.row(),copy=ui.column();ui.add(copy,ui.label(title));ui.space(copy,4);ui.add(copy,ui.text(subtitle,13,Ui.MUTED));
        row.addView(copy,new LinearLayout.LayoutParams(0,-2,1));row.addView(ui.text("‹",28,Ui.MUTED));ui.add(card,row);
        card.setMinimumHeight(ui.dp(80));card.setFocusable(true);card.setContentDescription(title+"، "+subtitle);card.setOnClickListener(v->a.navigate(target));
    }
    void settings(LinearLayout box){
        title(box,"تنظیمات","پروفایل و نگهداری اطلاعات دفتر.");
        JSONObject profile=db.profile();LinearLayout card=ui.card(box);
        ui.add(card,ui.label(profile.optString("name")));ui.add(card,ui.text("پایهٔ "+Dates.fa(profile.optInt("grade"))+" • "+profile.optString("field"),14,Ui.MUTED));ui.space(card,12);
        ui.stat(card,"هدف روزانه",Dates.fa(profile.optInt("dailyGoal"))+" دقیقه");ui.add(card,ui.button("ویرایش پروفایل",false,forms::profile));
        LinearLayout backup=ui.card(box);ui.add(backup,ui.label("پشتیبان دفتر"));
        ui.space(backup,6);ui.add(backup,ui.text("پیش از حذف برنامه یا تعویض گوشی، یک پشتیبان بگیر و در جای مطمئن نگه دار.",14,Ui.MUTED));
        ui.space(backup,14);ui.add(backup,ui.button("ذخیرهٔ پشتیبان",true,a.exporter::backup));
        ui.space(backup,10);ui.add(backup,ui.button("بازیابی از فایل",false,a.exporter::importBackup));
        ui.space(backup,10);ui.add(backup,ui.text("بازیابی، اطلاعات فعلی را پس از تأیید تو جایگزین می‌کند.",12,Ui.MUTED));
        LinearLayout about=ui.column();ui.space(about,12);
        ui.add(about,ui.text("دفتر ستاره • نسخهٔ ۱٫۱٫۰\nاطلاعات روی همین گوشی می‌ماند و استفاده از برنامه به اینترنت نیاز ندارد. همگام‌سازی ابری و ورود پیامکی در این نسخه وجود ندارد.\nفونت وزیرمتن با مجوز SIL Open Font License 1.1 استفاده شده است.",13,Ui.MUTED));
        ui.disclosure(box,"دربارهٔ دفتر ستاره",about,false);
    }
    final class StudyChart extends View {
        final String start;final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);final int[] minutes=new int[7];final String[] labels={"ش","ی","د","س","چ","پ","ج"};
        StudyChart(MainActivity context,String first){super(context);start=first;StringBuilder description=new StringBuilder("مطالعهٔ هفته: ");for(int i=0;i<7;i++){String day=LocalDate.parse(start).plusDays(i).toString();minutes[i]=db.totalMinutes(day,day);description.append(Dates.format(day)).append(" ").append(minutes[i]).append(" دقیقه؛ ");}setContentDescription(description.toString());setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_YES);}
        @Override protected void onDraw(Canvas canvas){super.onDraw(canvas);float width=getWidth(),height=getHeight(),gap=width/7;int max=30;for(int value:minutes)max=Math.max(max,value);paint.setTypeface(ui.font);paint.setTextAlign(Paint.Align.CENTER);for(int i=0;i<7;i++){float x=width-gap*(i+.5f),bar=(height-ui.dp(50))*minutes[i]/max;paint.setColor(Ui.BORDER);canvas.drawRoundRect(x-ui.dp(12),ui.dp(20),x+ui.dp(12),height-ui.dp(30),ui.dp(7),ui.dp(7),paint);paint.setColor(Ui.ACCENT);if(bar>0)canvas.drawRoundRect(x-ui.dp(12),height-ui.dp(30)-bar,x+ui.dp(12),height-ui.dp(30),ui.dp(7),ui.dp(7),paint);paint.setColor(Ui.MUTED);paint.setTextSize(ui.dp(11));canvas.drawText(labels[i],x,height-ui.dp(8),paint);canvas.drawText(Dates.fa(minutes[i]),x,Math.max(ui.dp(14),height-ui.dp(38)-bar),paint);}}
    }
}
