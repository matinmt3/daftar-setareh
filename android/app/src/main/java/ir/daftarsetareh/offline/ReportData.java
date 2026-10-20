package ir.daftarsetareh.offline;

import org.json.JSONObject;
import java.time.LocalDate;
import java.util.*;

/** Recomputed from saved records, including correct no-data and previous-period states. */
final class ReportData {
    final String start,end,title; final List<String> lines=new ArrayList<>(); final Double average;final int minutes,completed,total;
    ReportData(Store db,String anchor,String period){
        String[] range=Dates.period(anchor,period);start=range[0];end=range[1];title=period.equals("weekly")?"کارنامهٔ هفتگی":"کارنامهٔ ماهانه";average=db.average(start,end);minutes=db.totalMinutes(start,end);int count=0,done=0,graded=0,pending=0;Set<String> reportDays=new HashSet<>();
        for(JSONObject session:db.all("sessions"))if(Core.inRange(session.optString("date"),start,end)){count++;if(session.optBoolean("completed"))done++;}completed=done;total=count;
        for(JSONObject exam:db.all("exams"))if(Core.inRange(exam.optString("date"),start,end)){if(exam.isNull("grade"))pending++;else graded++;}
        for(JSONObject report:db.all("reports"))if(Core.inRange(report.optString("date"),start,end))reportDays.add(report.optString("date"));
        lines.add("دفتر ستاره • "+title);lines.add(db.profile().optString("name")+" • پایهٔ "+Dates.fa(db.profile().optInt("grade")));lines.add(Dates.format(start)+" تا "+Dates.format(end));
        lines.add("میانگین درس‌ها: "+Dates.decimal(average==null?null:average*db.profile().optDouble("scale",20)/100)+" از "+Dates.fa(db.profile().optDouble("scale",20))+"  |  "+Dates.decimal(average)+"٪");
        lines.add("مطالعهٔ ثبت‌شده: "+Dates.fa(minutes)+" دقیقه در "+Dates.fa(reportDays.size())+" روز");lines.add("کارهای انجام‌شده: "+Dates.fa(db.tasks(start,end,true))+" • در انتظار: "+Dates.fa(db.tasks(start,end,false)));
        lines.add("جلسه‌های کامل: "+Dates.fa(completed)+" از "+Dates.fa(total)+(total==0?" • هنوز برنامه‌ای ثبت نشده":" • "+Dates.fa(Math.round(completed*100d/total))+"٪"));lines.add("آزمون نمره‌دار: "+Dates.fa(graded)+" • منتظر نمره: "+Dates.fa(pending));
        String[] previous=Dates.period(LocalDate.parse(start).minusDays(1).toString(),period);Double prev=db.average(previous[0],previous[1]);
        lines.add("مقایسه با دورهٔ پیش: "+(average==null||prev==null?"برای مقایسهٔ نمره دادهٔ کافی نیست.":"تغییر میانگین "+Dates.decimal(average-prev)+" واحد درصد"));lines.add("تغییر مطالعه نسبت به دورهٔ پیش: "+Dates.fa(minutes-db.totalMinutes(previous[0],previous[1]))+" دقیقه");
        lines.add("میانگین هر درس در همین دوره");Map<String,Double> stats=db.subjectAverages(start,end);int validSubjects=0;String highest="",lowest="";double high=-1,low=101;
        for(Map.Entry<String,Double> row:stats.entrySet()){if(row.getValue()==null)continue;validSubjects++;lines.add(db.subjectName(row.getKey())+": "+Dates.decimal(row.getValue()*db.profile().optDouble("scale",20)/100)+" از "+Dates.fa(db.profile().optDouble("scale",20))+" • "+Dates.decimal(row.getValue())+"٪");if(row.getValue()>high){high=row.getValue();highest=db.subjectName(row.getKey());}if(row.getValue()<low){low=row.getValue();lowest=db.subjectName(row.getKey());}}
        if(validSubjects==0)lines.add("در این دوره هنوز نمره‌ای اعلام نشده؛ میانگین صفر فرض نمی‌شود.");if(validSubjects>=2){lines.add("بالاترین میانگین این دوره: "+highest);lines.add("فرصت تمرین بیشتر نسبت به درس‌های دیگر: "+lowest);}
        lines.add("هدف‌های فعال در تاریخ مرجع (با دورهٔ مستقل هر هدف)");int goals=0;for(JSONObject goal:db.all("goals"))if(goal.optBoolean("active")){goals++;double value=db.goalValue(goal,anchor),target=goal.optDouble("target");lines.add(goal.optString("title")+": "+Dates.decimal(value)+" از "+Dates.decimal(target)+" • "+Dates.fa(Math.min(100,Math.round(value*100/target)))+"٪");}if(goals==0)lines.add("هنوز هدف فعالی ثبت نشده است.");
        lines.add("روش محاسبه: نمره‌ها ابتدا به درصد تبدیل می‌شوند. میانگین هر درس با ضریب آزمون (خالی = ۱) محاسبه می‌شود؛ میانگین کل، میانگین برابر درس‌های دارای نمره است. نمرهٔ خالی در محاسبه وارد نمی‌شود؛ صفر واقعی وارد می‌شود.");lines.add("این کارنامه بر پایهٔ داده‌های واردشدهٔ خودت است و کارنامهٔ رسمی مدرسه نیست. زمان تکمیل برنامه دوباره به مطالعهٔ ثبت‌شده افزوده نمی‌شود.");lines.add("ساخته‌شده در "+Dates.format(Dates.today())+(db.profile().optBoolean("demo")?" • دادهٔ نمونه":""));
    }
    String text(){return String.join("\n\n",lines);}
}
