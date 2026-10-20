package ir.daftarsetareh.offline;

import android.app.Activity;
import android.content.*;
import android.content.res.Configuration;
import android.os.*;
import android.view.*;
import android.widget.*;
import org.json.JSONObject;
import java.util.*;

/** Native offline host. Screens, forms, persistence, calculations and export are separate. */
public final class MainActivity extends Activity {
    Store store; Ui ui; Forms forms; Screens screens; Exporter exporter;
    LinearLayout root,content; String screen="home",referenceDate=Dates.today(),cardPeriod="weekly";
    @Override protected void attachBaseContext(Context base){Configuration config=new Configuration(base.getResources().getConfiguration());Locale locale=new Locale("fa","IR");config.setLocale(locale);config.setLayoutDirection(locale);super.attachBaseContext(base.createConfigurationContext(config));}
    @Override public void onCreate(Bundle state){super.onCreate(state);store=new Store(getApplicationContext());ui=new Ui(this);forms=new Forms(this);screens=new Screens(this);exporter=new Exporter(this);if(state!=null){screen=state.getString("screen","home");referenceDate=state.getString("date",Dates.today());cardPeriod=state.getString("period","weekly");}if(Build.VERSION.SDK_INT>=33)BackApi33.register(this);refresh();}
    @Override protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);state.putString("screen",screen);state.putString("date",referenceDate);state.putString("period",cardPeriod);}
    @Override protected void onDestroy(){exporter.worker.shutdown();store.close();super.onDestroy();}
    void navigate(String destination){screen=destination;refresh();}
    void refresh(){
        root=ui.column();root.setBackgroundColor(Ui.BACKGROUND);root.setOnApplyWindowInsetsListener((view,insets)->{if(Build.VERSION.SDK_INT>=30){android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars());view.setPadding(0,bars.top,0,bars.bottom);}else view.setPadding(0,insets.getSystemWindowInsetTop(),0,insets.getSystemWindowInsetBottom());return insets;});setContentView(root);
        LinearLayout header=ui.row();header.setPadding(ui.dp(20),ui.dp(12),ui.dp(20),ui.dp(8));TextView brand=ui.text("دفتر ستاره",20,Ui.INK);brand.setTypeface(ui.font,android.graphics.Typeface.BOLD);header.addView(brand,new LinearLayout.LayoutParams(0,-2,1));TextView offline=ui.text("آفلاین",12,Ui.TEAL);offline.setPadding(ui.dp(12),ui.dp(5),ui.dp(12),ui.dp(5));offline.setBackground(ui.shape(Ui.TINT,20));header.addView(offline);ui.add(root,header);
        if(!store.hasProfile()){onboarding();return;}
        if(store.profile().optBoolean("demo")){TextView demo=ui.text("دادهٔ نمونه • این دفتر برای آشنایی است",12,Ui.GOLD);demo.setPadding(ui.dp(20),0,ui.dp(20),ui.dp(8));ui.add(root,demo);}
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);content=ui.column();content.setPadding(ui.dp(18),ui.dp(4),ui.dp(18),ui.dp(24));scroll.addView(content);root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        switch(screen){case "reports":screens.reports(content);break;case "exams":screens.exams(content);break;case "planner":screens.planner(content);break;case "goals":screens.goals(content);break;case "cards":screens.cards(content);break;case "subjects":screens.subjects(content);break;case "settings":screens.settings(content);break;case "more":screens.more(content);break;default:screens.home(content);}
        LinearLayout nav=ui.row();nav.setPadding(ui.dp(6),ui.dp(7),ui.dp(6),ui.dp(8));nav.setBackgroundColor(android.graphics.Color.WHITE);
        String[] ids={"home","reports","planner","exams","more"},labels={"امروز","مطالعه","برنامه","نمره‌ها","بیشتر"};
        for(int i=0;i<ids.length;i++){final String id=ids[i];Button button=ui.button(labels[i],false,()->navigate(id));button.setTextSize(12);button.setPadding(0,ui.dp(3),0,ui.dp(3));boolean active=screen.equals(id)||(id.equals("more")&&Arrays.asList("goals","cards","subjects","settings").contains(screen));button.setBackground(ui.shape(active?Ui.TINT:android.graphics.Color.WHITE,10));button.setTextColor(active?Ui.ACCENT:Ui.MUTED);button.setSelected(active);button.setContentDescription(labels[i]+(active?"، انتخاب‌شده":""));LinearLayout.LayoutParams item=new LinearLayout.LayoutParams(0,ui.dp(52),1);item.setMargins(ui.dp(2),0,ui.dp(2),0);nav.addView(button,item);}ui.add(root,nav);
    }
    void onboarding(){
        ScrollView scroll=new ScrollView(this);LinearLayout box=ui.column();box.setPadding(ui.dp(24),ui.dp(18),ui.dp(24),ui.dp(24));scroll.addView(box);root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        ui.add(box,ui.text("درس‌هایت،\nکمی مرتب‌تر.",30,Ui.INK));ui.space(box,12);ui.add(box,ui.text("مطالعه‌ات را ثبت کن، برای فردا برنامه بریز و پیشرفتت را ببین. اطلاعات روی همین گوشی می‌ماند.",15,Ui.MUTED));
        Ui.Form form=ui.new Form();EditText name=form.field("نام تو","",false,false);List<Ui.Choice> grades=new ArrayList<>();for(int i=1;i<=12;i++)grades.add(new Ui.Choice(String.valueOf(i),"پایهٔ "+Dates.fa(i)));Spinner grade=form.choice("پایهٔ تحصیلی",grades,"7");Spinner field=form.choice("رشته / گروه",Forms.options("عمومی","ریاضی و فیزیک","علوم تجربی","علوم انسانی","فنی و حرفه‌ای"),"عمومی");form.note("شماره تلفن یا رمز لازم نیست. برای حفظ اطلاعات، از تنظیمات فایل پشتیبان بگیر.");ui.add(box,form.box);
        ui.add(box,ui.button("ساخت دفتر من  ←",true,()->{String[] names={"ریاضی","فارسی","علوم","زبان انگلیسی"};String[] colors={"#6C5CE7","#F06E86","#13B5A6","#2E9BEA"};List<JSONObject> subjects=new ArrayList<>();for(int i=0;i<names.length;i++)subjects.add(Store.object("id",Store.id(),"name",names[i],"color",colors[i],"archived",false));store.onboard(Store.object("id","local","name",Ui.value(name),"grade",Integer.parseInt(Ui.selected(grade)),"field",Ui.selected(field),"scale",20,"dailyGoal",90,"demo",false),subjects);screen="home";refresh();}));ui.space(box,12);ui.add(box,ui.button("دیدن دفتر نمونه",false,()->ui.confirm("ساخت نمونه","چند درس، گزارش و آزمون نمونه در این دفتر خالی ساخته شود؟",()->{store.seedDemo();refresh();})));
    }
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(result==RESULT_OK&&data!=null&&data.getData()!=null)exporter.result(request,data.getData());}
    void back(){if(Arrays.asList("goals","cards","subjects","settings").contains(screen))navigate("more");else if(!screen.equals("home"))navigate("home");else finish();}
    @Override public boolean onKeyUp(int keyCode,KeyEvent event){if(Build.VERSION.SDK_INT<33&&keyCode==KeyEvent.KEYCODE_BACK){back();return true;}return super.onKeyUp(keyCode,event);}
    @android.annotation.TargetApi(33) static final class BackApi33 {static void register(MainActivity activity){activity.getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,activity::back);}}
}
