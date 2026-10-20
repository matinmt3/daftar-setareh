package ir.daftarsetareh.offline;

import android.icu.util.Calendar;
import android.icu.util.TimeZone;
import android.icu.util.ULocale;
import android.icu.text.DateFormat;
import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.Date;

/** Android ICU provides the Persian calendar, including leap-year validation. */
public final class Dates {
    public static final ZoneId ZONE = ZoneId.of("Asia/Tehran");
    private Dates() {}
    static Calendar calendar() { return Calendar.getInstance(TimeZone.getTimeZone("Asia/Tehran"), new ULocale("fa_IR@calendar=persian")); }
    public static String today() { return LocalDate.now(ZONE).toString(); }
    public static int[] jalali(String iso) {
        Calendar calendar = calendar(); calendar.setTimeInMillis(LocalDate.parse(iso).atTime(12, 0).atZone(ZONE).toInstant().toEpochMilli());
        return new int[]{calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH) + 1, calendar.get(Calendar.DAY_OF_MONTH)};
    }
    public static String iso(int year, int month, int day) {
        if (year < 1300 || year > 1500 || month < 1 || month > 12 || day < 1 || day > 31) throw new IllegalArgumentException("تاریخ شمسی معتبر نیست.");
        Calendar calendar = calendar(); calendar.clear(); calendar.setLenient(false); calendar.set(year, month - 1, day, 12, 0, 0);
        try { return Instant.ofEpochMilli(calendar.getTimeInMillis()).atZone(ZONE).toLocalDate().toString(); } catch (Exception error) { throw new IllegalArgumentException("این روز در تقویم شمسی وجود ندارد."); }
    }
    public static String format(String iso) {
        try {
            DateFormat format = DateFormat.getDateInstance(DateFormat.FULL, new ULocale("fa_IR@calendar=persian")); format.setTimeZone(TimeZone.getTimeZone("Asia/Tehran"));
            return format.format(Date.from(LocalDate.parse(iso).atTime(12, 0).atZone(ZONE).toInstant()));
        } catch (Exception error) { return iso; }
    }
    public static String[] period(String date, String kind) {
        LocalDate now = LocalDate.parse(date);
        if ("daily".equals(kind)) return new String[]{date, date};
        if ("weekly".equals(kind)) { LocalDate start = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.SATURDAY)); return new String[]{start.toString(), start.plusDays(6).toString()}; }
        int[] jalali = jalali(date);Calendar boundary=calendar();boundary.clear();boundary.setLenient(false);boundary.set(jalali[0],jalali[1]-1,1,12,0,0);
        String start=Instant.ofEpochMilli(boundary.getTimeInMillis()).atZone(ZONE).toLocalDate().toString();boundary.add(Calendar.MONTH,1);
        String next=Instant.ofEpochMilli(boundary.getTimeInMillis()).atZone(ZONE).toLocalDate().toString();
        return new String[]{start, LocalDate.parse(next).minusDays(1).toString()};
    }
    public static String fa(Object value) {
        String result = String.valueOf(value); for (int i = 0; i <= 9; i++) result = result.replace((char)('0' + i), (char)('۰' + i)); return result;
    }
    public static String decimal(Double value) { return value == null ? "—" : fa(String.format(java.util.Locale.US, "%.1f", value)); }
}
