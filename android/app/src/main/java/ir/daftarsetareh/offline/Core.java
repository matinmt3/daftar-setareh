package ir.daftarsetareh.offline;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.DayOfWeek;
import java.util.*;

/** Pure calculation rules shared by screens and device tests. No missing grade becomes zero. */
public final class Core {
    private Core() {}
    public static Double percent(Double grade, double max) {
        if (grade == null || !Double.isFinite(grade) || !Double.isFinite(max) || max <= 0 || grade < 0 || grade > max) return null;
        return grade * 100 / max;
    }
    public static Double weighted(List<double[]> values) {
        double sum = 0, weights = 0;
        for (double[] value : values) { if (value.length < 2 || !Double.isFinite(value[0]) || !Double.isFinite(value[1]) || value[1] <= 0) continue; sum += value[0] * value[1]; weights += value[1]; }
        return weights == 0 ? null : sum / weights;
    }
    public static Double overall(Collection<Double> averages) {
        double sum = 0; int count = 0;
        for (Double average : averages) if (average != null && Double.isFinite(average)) { sum += average; count++; }
        return count == 0 ? null : sum / count;
    }
    public static List<String> recurrence(String start, String end, Set<DayOfWeek> weekdays, boolean repeat) {
        LocalDate first = LocalDate.parse(start), last = LocalDate.parse(end);
        if (last.isBefore(first)) throw new IllegalArgumentException("پایان برنامه نباید پیش از شروع باشد.");
        if (!repeat) return Collections.singletonList(first.toString());
        if (java.time.temporal.ChronoUnit.DAYS.between(first, last) > 120) throw new IllegalArgumentException("بازهٔ تکرار حداکثر ۱۲۰ روز است.");
        if (weekdays.isEmpty()) throw new IllegalArgumentException("دست‌کم یک روز هفته را انتخاب کن.");
        List<String> dates = new ArrayList<>();
        for (LocalDate day = first; !day.isAfter(last); day = day.plusDays(1)) if (weekdays.contains(day.getDayOfWeek())) dates.add(day.toString());
        if (dates.isEmpty()) throw new IllegalArgumentException("در این بازه روزی مطابق انتخاب وجود ندارد.");
        return dates;
    }
    public static void validateSession(String time, int minutes) {
        LocalTime begin;
        try { begin = LocalTime.parse(time); } catch (Exception error) { throw new IllegalArgumentException("ساعت را مثل ۱۶:۳۰ وارد کن."); }
        if (minutes < 5 || minutes > 600) throw new IllegalArgumentException("مدت جلسه باید از ۵ تا ۶۰۰ دقیقه باشد.");
        if (begin.getHour() * 60 + begin.getMinute() + minutes >= 1440) throw new IllegalArgumentException("جلسه باید پیش از نیمه‌شب همان روز تمام شود.");
    }
    public static boolean inRange(String date, String start, String end) { return date.compareTo(start) >= 0 && date.compareTo(end) <= 0; }
    public static String[] intersection(String firstStart, String firstEnd, String secondStart, String secondEnd) {
        String start = firstStart.compareTo(secondStart) > 0 ? firstStart : secondStart;
        String end = firstEnd.compareTo(secondEnd) < 0 ? firstEnd : secondEnd;
        return start.compareTo(end) > 0 ? null : new String[]{start, end};
    }
    public static String ascii(String value) {
        StringBuilder out = new StringBuilder();
        for (char ch : value.trim().toCharArray()) {
            if (ch >= '۰' && ch <= '۹') out.append((char)('0' + ch - '۰'));
            else if (ch >= '٠' && ch <= '٩') out.append((char)('0' + ch - '٠'));
            else if (ch == '٫' || ch == '،') out.append('.'); else out.append(ch);
        }
        return out.toString();
    }
    public static double number(String value, double min, double max, String label) {
        try { double result = Double.parseDouble(ascii(value)); if (Double.isFinite(result) && result >= min && result <= max) return result; } catch (Exception ignored) {}
        throw new IllegalArgumentException(label + " باید بین " + min + " و " + max + " باشد.");
    }
}
