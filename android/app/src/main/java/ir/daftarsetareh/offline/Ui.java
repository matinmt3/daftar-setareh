package ir.daftarsetareh.offline;

import android.app.*;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.text.InputType;
import android.view.*;
import android.widget.*;
import org.json.JSONObject;
import java.util.*;

final class Ui {
    static final int PURPLE=Color.rgb(108,92,231), CREAM=Color.rgb(255,249,239), INK=Color.rgb(43,39,67), MUTED=Color.rgb(112,106,135), GOLD=Color.rgb(154,101,5), TEAL=Color.rgb(8,121,111), BORDER=Color.rgb(234,229,244);
    final MainActivity a; final Typeface font; AlertDialog lastDialog;
    Ui(MainActivity activity) { a=activity; Typeface candidate;try{candidate=Typeface.createFromAsset(a.getAssets(),"Vazirmatn-Regular.ttf");}catch(Exception error){candidate=Typeface.create("sans",Typeface.NORMAL);}font=candidate; }
    int dp(float value){return (int)(a.getResources().getDisplayMetrics().density*value+.5f);}
    GradientDrawable shape(int color,int radius){GradientDrawable drawable=new GradientDrawable();drawable.setColor(color);drawable.setCornerRadius(dp(radius));return drawable;}
    LinearLayout column(){LinearLayout view=new LinearLayout(a);view.setOrientation(LinearLayout.VERTICAL);view.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);return view;}
    LinearLayout row(){LinearLayout view=new LinearLayout(a);view.setOrientation(LinearLayout.HORIZONTAL);view.setGravity(Gravity.CENTER_VERTICAL);view.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);return view;}
    TextView text(String value,int size,int color){TextView view=new TextView(a);view.setText(value);view.setTextColor(color);view.setTextSize(size);view.setTypeface(font);view.setGravity(Gravity.START);view.setTextDirection(View.TEXT_DIRECTION_RTL);view.setLineSpacing(dp(3),1.05f);return view;}
    TextView label(String value){TextView view=text(value,15,INK);view.setTypeface(font,Typeface.BOLD);return view;}
    void space(LinearLayout into,int height){Space view=new Space(a);into.addView(view,new LinearLayout.LayoutParams(1,dp(height)));}
    void add(LinearLayout into,View child){into.addView(child,new LinearLayout.LayoutParams(-1,-2));}
    LinearLayout card(LinearLayout into){LinearLayout card=column();card.setPadding(dp(18),dp(18),dp(18),dp(18));card.setBackground(shape(Color.WHITE,22));card.setElevation(dp(1));LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,-2);params.setMargins(dp(1),dp(6),dp(1),dp(8));into.addView(card,params);return card;}
    Button button(String title,boolean primary,Runnable action){Button view=new Button(a);view.setText(title);view.setTypeface(font,Typeface.BOLD);view.setTextSize(14);view.setAllCaps(false);view.setTextColor(primary?Color.WHITE:PURPLE);view.setBackground(shape(primary?PURPLE:Color.rgb(239,235,255),15));view.setPadding(dp(12),dp(10),dp(12),dp(10));view.setMinHeight(dp(48));view.setMinimumHeight(dp(48));view.setOnClickListener(v->safe(action));return view;}
    void buttons(LinearLayout into,String first,Runnable action,String second,Runnable other){LinearLayout row=row();Button one=button(first,true,action),two=button(second,false,other);LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,-2,1);p.setMargins(dp(4),dp(4),dp(4),dp(4));row.addView(one,p);row.addView(two,new LinearLayout.LayoutParams(p));add(into,row);}
    void safe(Runnable action){try{action.run();}catch(Exception error){toast(error.getMessage()==null?"این کار انجام نشد. دوباره امتحان کن.":error.getMessage());}}
    void toast(String message){Toast.makeText(a,message,Toast.LENGTH_LONG).show();}
    void confirm(String title,String message,Runnable action){new AlertDialog.Builder(a).setTitle(title).setMessage(message).setNegativeButton("انصراف",null).setPositiveButton("تأیید",(d,w)->safe(action)).show();}
    void empty(LinearLayout into,String title,String detail){LinearLayout card=card(into);add(card,text("✦",38,PURPLE));add(card,label(title));space(card,8);add(card,text(detail,14,MUTED));}
    void progress(LinearLayout into,double current,double target){ProgressBar progress=new ProgressBar(a,null,android.R.attr.progressBarStyleHorizontal);progress.setMax(1000);progress.setProgress((int)Math.min(1000,Math.max(0,target>0?current/target*1000:0)));progress.setProgressTintList(android.content.res.ColorStateList.valueOf(PURPLE));progress.setProgressBackgroundTintList(android.content.res.ColorStateList.valueOf(BORDER));LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,dp(10));params.setMargins(0,dp(12),0,dp(8));into.addView(progress,params);}
    void stat(LinearLayout into,String title,String value){LinearLayout row=row();TextView label=text(title,14,MUTED),amount=text(value,19,PURPLE);amount.setTypeface(font,Typeface.BOLD);row.addView(label,new LinearLayout.LayoutParams(0,-2,1));row.addView(amount);add(into,row);space(into,8);}
    void applyFont(View view){if(view instanceof TextView)((TextView)view).setTypeface(font);if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)applyFont(((ViewGroup)view).getChildAt(i));}
    static final class Choice { final String id,name;Choice(String id,String name){this.id=id;this.name=name;}@Override public String toString(){return name;} }
    class Form {
        final LinearLayout box=column();
        Form(){box.setPadding(dp(20),dp(8),dp(20),dp(20));}
        void named(String title,View input){input.setId(View.generateViewId());TextView caption=label(title);caption.setLabelFor(input.getId());add(box,caption);}
        EditText field(String title,String value,boolean number,boolean multiline){EditText input=new EditText(a);named(title,input);input.setText(value);input.setTextSize(15);input.setTypeface(font);input.setTextColor(INK);input.setPadding(dp(12),dp(10),dp(12),dp(10));input.setBackground(shape(CREAM,12));input.setTextDirection(number?View.TEXT_DIRECTION_LTR:View.TEXT_DIRECTION_RTL);input.setGravity(Gravity.TOP|Gravity.START);input.setInputType(number?InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_FLAG_DECIMAL:InputType.TYPE_CLASS_TEXT|(multiline?InputType.TYPE_TEXT_FLAG_MULTI_LINE:InputType.TYPE_TEXT_FLAG_CAP_SENTENCES));input.setMinLines(multiline?3:1);input.setMaxLines(multiline?8:1);add(box,input);space(box,14);return input;}
        Button date(String title,String iso){Button button=button(Dates.format(iso),false,()->{});named(title,button);button.setTag(iso);button.setOnClickListener(v->pickDate(button));add(box,button);space(box,14);return button;}
        Spinner choice(String title,List<Choice> choices,String selected){Spinner spinner=new Spinner(a);named(title,spinner);ArrayAdapter<Choice> adapter=new ArrayAdapter<>(a,android.R.layout.simple_spinner_dropdown_item,choices);spinner.setAdapter(adapter);spinner.setMinimumHeight(dp(52));spinner.setBackground(shape(CREAM,12));for(int i=0;i<choices.size();i++)if(choices.get(i).id.equals(selected))spinner.setSelection(i);add(box,spinner);space(box,14);return spinner;}
        CheckBox check(String title,boolean selected){CheckBox checkbox=new CheckBox(a);checkbox.setText(title);checkbox.setTextColor(INK);checkbox.setTextSize(14);checkbox.setTypeface(font);checkbox.setChecked(selected);checkbox.setMinHeight(dp(48));add(box,checkbox);return checkbox;}
        void note(String value){add(box,text(value,13,MUTED));space(box,12);}
        void show(String title,Runnable save){show(title,save,true);}
        void show(String title,Runnable save,boolean refresh){ScrollView scroll=new ScrollView(a);scroll.setFillViewport(true);scroll.addView(box);AlertDialog dialog=new AlertDialog.Builder(a).setTitle(title).setView(scroll).setNegativeButton("انصراف",null).setPositiveButton("ذخیره",null).create();lastDialog=dialog;dialog.show();dialog.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v->{try{save.run();dialog.dismiss();if(refresh)a.refresh();}catch(Exception error){toast(error.getMessage());}});applyFont(box);}
    }
    static String selected(Spinner spinner){Object choice=spinner.getSelectedItem();return choice instanceof Choice?((Choice)choice).id:"";}
    static String value(EditText input){return input.getText().toString().trim();}
    void pickDate(Button target){pickDate(target,iso->{});}
    void pickDate(Button target,java.util.function.Consumer<String> selected){int[] current=Dates.jalali((String)target.getTag());Form form=new Form();EditText year=form.field("سال شمسی",String.valueOf(current[0]),true,false),month=form.field("ماه (۱ تا ۱۲)",String.valueOf(current[1]),true,false),day=form.field("روز",String.valueOf(current[2]),true,false);form.note("تقویم هجری شمسی؛ روزهای نامعتبر و اسفند غیرکبیسه پذیرفته نمی‌شوند.");form.show("انتخاب تاریخ شمسی",()->{String iso=Dates.iso(Forms.whole(year,1300,1500,"سال"),Forms.whole(month,1,12,"ماه"),Forms.whole(day,1,31,"روز"));target.setTag(iso);target.setText(Dates.format(iso));selected.accept(iso);},false);}
}
