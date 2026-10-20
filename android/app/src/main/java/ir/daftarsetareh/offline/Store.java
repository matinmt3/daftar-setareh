package ir.daftarsetareh.offline;

import android.content.Context;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import org.json.*;
import java.time.LocalDate;
import java.util.*;

/** Private offline SQLite store. Every write/import passes the same domain validation. */
public final class Store extends SQLiteOpenHelper {
    static final List<String> COLLECTIONS = Arrays.asList("profile", "subjects", "reports", "exams", "sessions", "goals");
    public Store(Context context) { this(context, "daftar-setareh.db"); }
    Store(Context context, String databaseName) { super(context, databaseName, null, 1); }
    @Override public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE entries (category TEXT NOT NULL, id TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY(category,id))");
    }
    @Override public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) { throw new IllegalStateException("Unsupported database upgrade; preserve existing data."); }
    public static JSONObject object(Object... pairs) {
        JSONObject value = new JSONObject();
        try { for (int i = 0; i < pairs.length; i += 2) value.put((String)pairs[i], pairs[i + 1] == null ? JSONObject.NULL : pairs[i + 1]); return value; }
        catch (JSONException error) { throw new IllegalArgumentException(error); }
    }
    public static JSONArray array(Collection<JSONObject> values) { return new JSONArray(values); }
    static String id() { return UUID.randomUUID().toString(); }
    static JSONObject copy(JSONObject value) { try { return new JSONObject(value.toString()); } catch (JSONException error) { throw new IllegalArgumentException(error); } }
    public List<JSONObject> all(String category) {
        require(COLLECTIONS.contains(category), "بخش داده معتبر نیست.");
        List<JSONObject> values = new ArrayList<>();
        try (Cursor cursor = getReadableDatabase().query("entries", new String[]{"body"}, "category=?", new String[]{category}, null, null, "rowid DESC")) {
            while (cursor.moveToNext()) { try { values.add(new JSONObject(cursor.getString(0))); } catch (JSONException error) { throw new IllegalStateException("Stored data cannot be read.", error); } }
        }
        return values;
    }
    public JSONObject get(String category, String id) { for (JSONObject value : all(category)) if (value.optString("id").equals(id)) return value; return null; }
    public JSONObject profile() { JSONObject value = get("profile", "local"); return value == null ? object("id", "local", "name", "", "grade", 7, "field", "عمومی", "scale", 20, "dailyGoal", 90, "demo", false) : value; }
    public boolean hasProfile() { return get("profile", "local") != null; }
    /** First profile and preset subjects are one unit: never leave a half-created notebook. */
    public void onboard(JSONObject profile,List<JSONObject> subjects) {
        require(!hasProfile(),"این دفتر از قبل پروفایل دارد.");SQLiteDatabase db=getWritableDatabase();db.beginTransaction();
        try {save("profile",profile);for(JSONObject subject:subjects)save("subjects",subject);db.setTransactionSuccessful();}finally{db.endTransaction();}
    }
    public void save(String category, JSONObject value) {
        JSONObject clean = validate(category, value, snapshot());
        put(getWritableDatabase(), category, clean);
    }
    static void put(SQLiteDatabase db, String category, JSONObject value) {
        ContentValues row = new ContentValues(); row.put("category", category); row.put("id", value.optString("id")); row.put("body", value.toString());
        if (db.insertWithOnConflict("entries", null, row, SQLiteDatabase.CONFLICT_REPLACE) == -1) throw new android.database.SQLException("Database write failed; transaction must roll back.");
    }
    public void remove(String category, String id) {
        require(!category.equals("profile") && !category.equals("subjects"), "برای حفظ سوابق، درس را بایگانی کن.");
        getWritableDatabase().delete("entries", "category=? AND id=?", new String[]{category, id});
    }
    public void removeSeries(String seriesId) { require(!seriesId.isEmpty(),"شناسهٔ مجموعه معتبر نیست.");SQLiteDatabase db=getWritableDatabase();db.beginTransaction();try{for (JSONObject value : all("sessions")) if (seriesId.equals(value.optString("seriesId"))) remove("sessions", value.optString("id"));db.setTransactionSuccessful();}finally{db.endTransaction();} }
    Map<String,List<JSONObject>> snapshot() {
        Map<String,List<JSONObject>> snapshot = new LinkedHashMap<>(); for (String category : COLLECTIONS) snapshot.put(category, all(category)); return snapshot;
    }
    public String exportJson() {
        JSONObject data = new JSONObject();
        try { for (String category : COLLECTIONS) data.put(category, array(all(category))); return object("app", "daftar-setareh-offline", "version", 1, "exportedAt", java.time.Instant.now().toString(), "data", data).toString(2); }
        catch (JSONException error) { throw new IllegalStateException(error); }
    }
    public Map<String,List<JSONObject>> validateBackup(String input) {
        require(input.length() <= 5_000_000, "پشتیبان باید کوچک‌تر از ۵ مگابایت باشد.");
        try {
            JSONObject root = new JSONObject(input);
            require(root.optString("app").equals("daftar-setareh-offline") && root.optInt("version") == 1, "فرمت یا نسخهٔ فایل پشتیبان سازگار نیست.");
            JSONObject data = root.getJSONObject("data"); Map<String,List<JSONObject>> result = new LinkedHashMap<>(); int count = 0;
            require(data.length() == COLLECTIONS.size(), "بخش‌های پشتیبان کامل نیستند.");
            for (String category : COLLECTIONS) {
                JSONArray entries = data.getJSONArray(category); List<JSONObject> items = new ArrayList<>(); Set<String> ids = new HashSet<>();
                require(entries.length() <= 10000, "تعداد رکوردهای پشتیبان بیش از حد است.");
                for (int i = 0; i < entries.length(); i++) { JSONObject item = entries.getJSONObject(i); require(ids.add(item.getString("id")), "شناسهٔ تکراری در پشتیبان وجود دارد."); items.add(item); count++; }
                result.put(category, items);
            }
            require(count <= 20000 && result.get("profile").size() == 1, "پشتیبان باید دقیقاً یک پروفایل داشته باشد.");
            Map<String,List<JSONObject>> clean = new LinkedHashMap<>();
            for (String category : COLLECTIONS) { List<JSONObject> records = new ArrayList<>(); for (JSONObject item : result.get(category)) records.add(validate(category, item, result)); clean.put(category, records); }
            return clean;
        } catch (JSONException error) { throw new IllegalArgumentException("فایل JSON معتبر و کامل نیست.", error); }
    }
    /** All validation precedes replacement. A failed write rolls back the complete import. */
    public void importJson(String input) {
        Map<String,List<JSONObject>> validated = validateBackup(input); SQLiteDatabase db = getWritableDatabase();
        db.beginTransaction();
        try { db.delete("entries", null, null); for (String category : COLLECTIONS) for (JSONObject item : validated.get(category)) put(db, category, item); db.setTransactionSuccessful(); }
        finally { db.endTransaction(); }
    }
    static void require(boolean condition, String message) { if (!condition) throw new IllegalArgumentException(message); }
    static String text(JSONObject value, String key, int max, boolean required) {
        Object raw = value.opt(key); require(raw == null || raw == JSONObject.NULL || raw instanceof String, "مقدار متن معتبر نیست: " + key);
        String result = value.optString(key, "").trim(); if (result.equals("null")) result = "";
        require(result.length() <= max && (!required || !result.isEmpty()), required ? "عنوان یا نام را کامل وارد کن." : "متن بیش از حد طولانی است."); return result;
    }
    static double number(JSONObject value, String key, double min, double max) {
        Object raw = value.opt(key); require(raw instanceof Number && Double.isFinite(((Number)raw).doubleValue()), "مقدار عددی معتبر نیست: " + key);
        double result = ((Number)raw).doubleValue(); require(result >= min && result <= max, "عدد خارج از محدوده است: " + key); return result;
    }
    static int integer(JSONObject value, String key, int min, int max) { double result = number(value, key, min, max); require(result == Math.floor(result), "عدد باید صحیح باشد: " + key); return (int)result; }
    static boolean bool(JSONObject value, String key) { require(value.opt(key) instanceof Boolean, "مقدار وضعیت معتبر نیست: " + key); return value.optBoolean(key); }
    static String date(JSONObject value, String key) {
        String result = text(value, key, 10, true); try { LocalDate.parse(result);int year=Dates.jalali(result)[0];require(result.matches("\\d{4}-\\d{2}-\\d{2}") && year>=1300 && year<=1500,"سال تاریخ باید از ۱۳۰۰ تا ۱۵۰۰ شمسی باشد.");return result; } catch (Exception error) { throw new IllegalArgumentException("تاریخ معتبر نیست یا خارج از بازهٔ ۱۳۰۰ تا ۱۵۰۰ شمسی است: " + key); }
    }
    static void subject(String id, boolean optional, Map<String,List<JSONObject>> data) { if (optional && id.isEmpty()) return; require(data.get("subjects").stream().anyMatch(value -> value.optString("id").equals(id)), "درس مربوط به این رکورد در فایل وجود ندارد."); }
    static JSONObject validate(String category, JSONObject source, Map<String,List<JSONObject>> data) {
        require(COLLECTIONS.contains(category), "بخش داده معتبر نیست."); String id = text(source, "id", 64, true); require(id.matches("[a-zA-Z0-9-]+"), "شناسه معتبر نیست.");
        JSONObject value = object("id", id);
        try {
            if (category.equals("profile")) {
                require(id.equals("local"), "شناسهٔ پروفایل معتبر نیست.");
                value.put("name", text(source,"name",80,true)); value.put("grade",integer(source,"grade",1,12)); value.put("field",text(source,"field",80,false));
                value.put("scale",number(source,"scale",1,100)); value.put("dailyGoal",integer(source,"dailyGoal",5,1440)); value.put("demo",bool(source,"demo"));
            } else if (category.equals("subjects")) {
                String name = text(source,"name",80,true); require(data.get("subjects").stream().noneMatch(item -> !item.optString("id").equals(id) && item.optString("name").trim().equalsIgnoreCase(name)),"درسی با این نام از قبل وجود دارد.");
                value.put("name",name); String color = text(source,"color",7,true); require(color.matches("#[0-9a-fA-F]{6}"),"رنگ معتبر نیست."); value.put("color",color); value.put("archived",bool(source,"archived"));
            } else if (category.equals("reports")) {
                String day = date(source,"date"); value.put("date",day);
                for (String field : new String[]{"lessons","exercises","difficulties","reflection","nextGoals"}) value.put(field,text(source,field,4000,false));
                JSONArray rows = source.getJSONArray("subjects"), tasks = source.getJSONArray("tasks"); require(rows.length() <= 40 && tasks.length() <= 50,"تعداد درس یا کار بیش از حد است.");
                JSONArray cleanRows = new JSONArray(), cleanTasks = new JSONArray(); Set<String> seen = new HashSet<>(); int total = 0;
                for (int i=0;i<rows.length();i++) { JSONObject row=rows.getJSONObject(i); String subjectId=text(row,"subjectId",64,true); subject(subjectId,false,data); require(seen.add(subjectId),"هر درس در یک گزارش فقط یک ردیف دارد."); int minutes=integer(row,"minutes",1,1440); total += minutes; cleanRows.put(object("subjectId",subjectId,"minutes",minutes,"note",text(row,"note",1000,false))); }
                for (JSONObject other:data.get("reports")) if (!other.optString("id").equals(id) && day.equals(other.optString("date"))) total += minutes(other);
                require(total <= 1440,"جمع مطالعهٔ یک روز نباید از ۱۴۴۰ دقیقه بیشتر شود.");
                for (int i=0;i<tasks.length();i++) { JSONObject task=tasks.getJSONObject(i); String subjectId=text(task,"subjectId",64,false); subject(subjectId,true,data); cleanTasks.put(object("title",text(task,"title",200,true),"completed",bool(task,"completed"),"subjectId",subjectId)); }
                value.put("subjects",cleanRows); value.put("tasks",cleanTasks);
                require(rows.length()>0 || tasks.length()>0 || !value.optString("reflection").isEmpty() || !value.optString("lessons").isEmpty() || !value.optString("exercises").isEmpty() || !value.optString("difficulties").isEmpty() || !value.optString("nextGoals").isEmpty(),"گزارش خالی ذخیره نمی‌شود.");
            } else if (category.equals("exams")) {
                String subjectId=text(source,"subjectId",64,true); subject(subjectId,false,data); value.put("subjectId",subjectId); value.put("title",text(source,"title",150,true)); value.put("date",date(source,"date"));
                double max=number(source,"maxGrade",1,10000); value.put("maxGrade",max);
                value.put("grade",source.isNull("grade") ? JSONObject.NULL : number(source,"grade",0,max));
                value.put("weight",source.isNull("weight") ? JSONObject.NULL : number(source,"weight",0.1,10)); value.put("notes",text(source,"notes",4000,false));
            } else if (category.equals("sessions")) {
                String subjectId=text(source,"subjectId",64,false); subject(subjectId,true,data); value.put("subjectId",subjectId); value.put("title",text(source,"title",150,true)); value.put("date",date(source,"date"));
                String time=text(source,"time",5,true); require(time.matches("\\d{2}:\\d{2}"),"ساعت معتبر نیست."); int duration=integer(source,"duration",5,600); Core.validateSession(time,duration);
                value.put("time",time); value.put("duration",duration); value.put("completed",bool(source,"completed")); value.put("seriesId",text(source,"seriesId",64,false));
                String kind=text(source,"kind",30,true), priority=text(source,"priority",20,true); require(Arrays.asList("مطالعه","تکلیف","مرور","آزمون","پروژه").contains(kind),"نوع جلسه معتبر نیست."); require(Arrays.asList("عادی","مهم","خیلی مهم").contains(priority),"اولویت معتبر نیست."); value.put("kind",kind); value.put("priority",priority); value.put("notes",text(source,"notes",4000,false));
            } else if (category.equals("goals")) {
                value.put("title",text(source,"title",150,true)); String metric=text(source,"metric",20,true), period=text(source,"period",20,true);
                require(Arrays.asList("minutes","tasks","average").contains(metric) && Arrays.asList("daily","weekly","monthly").contains(period),"نوع یا دورهٔ هدف معتبر نیست.");
                value.put("metric",metric); value.put("period",period); value.put("target",number(source,"target",1,metric.equals("average")?100:100000));
                String start=date(source,"start"), end=date(source,"end"); require(start.compareTo(end)<=0,"پایان هدف نباید پیش از شروع باشد."); value.put("start",start); value.put("end",end); value.put("active",bool(source,"active"));
            }
            return value;
        } catch (JSONException error) { throw new IllegalArgumentException("ساختار رکورد کامل نیست.",error); }
    }
    public static int minutes(JSONObject report) { int total=0; JSONArray rows=report.optJSONArray("subjects"); if(rows!=null)for(int i=0;i<rows.length();i++)total+=rows.optJSONObject(i).optInt("minutes"); return total; }
    public String subjectName(String id) { JSONObject value=get("subjects",id); return value==null?"بدون درس":value.optString("name"); }
    public LinkedHashMap<String,Double> subjectAverages(String start,String end) {
        LinkedHashMap<String,Double> result=new LinkedHashMap<>();
        for(JSONObject subject:all("subjects")) { List<double[]> grades=new ArrayList<>(); for(JSONObject exam:all("exams")) if(exam.optString("subjectId").equals(subject.optString("id"))&&Core.inRange(exam.optString("date"),start,end)) { Double percent=Core.percent(exam.isNull("grade")?null:exam.optDouble("grade"),exam.optDouble("maxGrade")); if(percent!=null) grades.add(new double[]{percent,exam.isNull("weight")?1:exam.optDouble("weight")}); } result.put(subject.optString("id"),Core.weighted(grades)); }
        return result;
    }
    public Double average(String start,String end) { return Core.overall(subjectAverages(start,end).values()); }
    public int totalMinutes(String start,String end) { int total=0; for(JSONObject report:all("reports"))if(Core.inRange(report.optString("date"),start,end))total+=minutes(report); return total; }
    public int tasks(String start,String end,boolean completed) { int count=0; for(JSONObject report:all("reports"))if(Core.inRange(report.optString("date"),start,end)){JSONArray tasks=report.optJSONArray("tasks");for(int i=0;i<tasks.length();i++)if(tasks.optJSONObject(i).optBoolean("completed")==completed)count++;}return count; }
    public double goalValue(JSONObject goal,String date) {
        String[] period=Dates.period(date,goal.optString("period")); String[] range=Core.intersection(period[0],period[1],goal.optString("start"),goal.optString("end")); if(range==null)return 0;
        if(goal.optString("metric").equals("minutes"))return totalMinutes(range[0],range[1]); if(goal.optString("metric").equals("tasks"))return tasks(range[0],range[1],true); Double value=average(range[0],range[1]);return value==null?0:value;
    }
    public void saveSessions(List<JSONObject> sessions) {
        Map<String,List<JSONObject>> existing=snapshot(); List<JSONObject> clean=new ArrayList<>(); for(JSONObject session:sessions)clean.add(validate("sessions",session,existing)); SQLiteDatabase db=getWritableDatabase();db.beginTransaction();try{for(JSONObject session:clean)put(db,"sessions",session);db.setTransactionSuccessful();}finally{db.endTransaction();}
    }
    /** Explicit demo only, never overwrites a real profile or existing records. */
    public void seedDemo() {
        require(!hasProfile() && all("subjects").isEmpty() && all("reports").isEmpty(),"نمونه فقط روی دفتر خالی ساخته می‌شود.");
        SQLiteDatabase db=getWritableDatabase();db.beginTransaction();
        try {
            save("profile",object("id","local","name","ستارهٔ نمونه","grade",8,"field","عمومی","scale",20,"dailyGoal",90,"demo",true));
            String[] names={"ریاضی","علوم تجربی","فارسی","زبان انگلیسی"};String[] colors={"#6C5CE7","#13B5A6","#F06E86","#2E9BEA"};
            for(int i=0;i<names.length;i++)save("subjects",object("id","demo-subject-"+i,"name",names[i],"color",colors[i],"archived",false));
            LocalDate now=LocalDate.parse(Dates.today());
            for(int day=0;day<9;day++) { String date=now.minusDays(day).toString();save("reports",object("id","demo-report-"+day,"date",date,"subjects",new JSONArray().put(object("subjectId","demo-subject-0","minutes",30+day*3,"note","تمرین نمونه")).put(object("subjectId","demo-subject-1","minutes",25,"note","مرور")),"tasks",new JSONArray().put(object("title","حل تمرین نمونه","subjectId","demo-subject-0","completed",true)).put(object("title","مرور واژه‌ها","subjectId","demo-subject-3","completed",day%2==0)),"lessons","مرور فصل و حل تمرین","exercises","تمرین‌های کتاب","difficulties","تمرین بیشتر برای مسئله‌های دشوار","reflection","امروز با تمرکز پیش رفتم.","nextGoals","مرور نکته‌های امروز")); }
            for(int i=0;i<4;i++)save("exams",object("id","demo-exam-"+i,"subjectId","demo-subject-"+(i%2),"title","آزمون نمونه "+(i+1),"date",now.minusDays(i*2).toString(),"grade",i==3?null:16+i,"maxGrade",20,"weight",i==0?2:null,"notes","دادهٔ نمونه"));
            for(int i=0;i<5;i++)save("sessions",object("id","demo-session-"+i,"subjectId","demo-subject-"+(i%4),"title","مرور فصل نمونه","date",now.plusDays(i-1).toString(),"time","16:30","duration",45,"completed",i==0,"seriesId","","kind","مرور","priority","مهم","notes","برنامهٔ نمونه"));
            save("goals",object("id","demo-goal","title","این هفته ۳۰۰ دقیقه مطالعه","metric","minutes","period","weekly","target",300,"start",now.minusDays(20).toString(),"end",now.plusDays(60).toString(),"active",true));db.setTransactionSuccessful();
        } finally {db.endTransaction();}
    }
}
