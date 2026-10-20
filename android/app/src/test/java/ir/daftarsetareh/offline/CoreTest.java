package ir.daftarsetareh.offline;

import org.junit.Test;
import static org.junit.Assert.*;
import java.time.DayOfWeek;
import java.util.*;

public class CoreTest {
    @Test public void missingGradeIsMissing(){assertNull(Core.percent(null,20));}
    @Test public void zeroIsARealGrade(){assertEquals(0d,Core.percent(0d,20),0);}
    @Test public void normalizeAcrossScales(){assertEquals(90d,Core.percent(18d,20),0);assertEquals(90d,Core.percent(90d,100),0);}
    @Test public void badMaximumIsRejected(){assertNull(Core.percent(2d,0));assertNull(Core.percent(21d,20));assertNull(Core.percent(-1d,20));}
    @Test public void nonfiniteGradesAreIgnored(){assertNull(Core.percent(Double.NaN,20));assertNull(Core.percent(2d,Double.POSITIVE_INFINITY));}
    @Test public void weightedMeansRespectWeights(){assertEquals(80d,Core.weighted(Arrays.asList(new double[]{100,2},new double[]{40,1})),0);}
    @Test public void noGradesHaveNoAverage(){assertNull(Core.weighted(Collections.emptyList()));assertNull(Core.overall(Arrays.asList(null,null)));}
    @Test public void subjectsHaveEqualOverallWeight(){assertEquals(70d,Core.overall(Arrays.asList(100d,40d,null)),0);}
    @Test public void persianNumbersAreAccepted(){assertEquals(18.5,Core.number("۱۸٫۵",0,20,"نمره"),0);assertEquals("16:30",Core.ascii("۱۶:۳۰"));}
    @Test(expected=IllegalArgumentException.class) public void negativeMinutesAreRejected(){Core.number("-۳۰",0,1440,"دقیقه");}
    @Test public void decimalInputIsNeverConcatenated(){assertEquals(1.5,Core.number("۱٫۵",0,20,"نمره"),0);assertNotEquals(15d,Core.number("1.5",0,20,"نمره"),0);}
    @Test(expected=IllegalArgumentException.class) public void malformedNumberIsRejected(){Core.number("۱x۵",0,1440,"دقیقه");}
    @Test(expected=IllegalArgumentException.class) public void nonfiniteInputIsRejected(){Core.number("NaN",0,20,"نمره");}
    @Test public void recurrenceIncludesBounds(){assertEquals(Arrays.asList("2026-10-19","2026-10-26"),Core.recurrence("2026-10-19","2026-10-26",EnumSet.of(DayOfWeek.MONDAY),true));}
    @Test public void singleSessionHasOneDate(){assertEquals(1,Core.recurrence("2026-10-19","2026-10-19",Collections.emptySet(),false).size());}
    @Test(expected=IllegalArgumentException.class) public void recurrenceRejectsBackwards(){Core.recurrence("2026-10-20","2026-10-19",EnumSet.allOf(DayOfWeek.class),true);}
    @Test(expected=IllegalArgumentException.class) public void recurrenceRejectsOver120Days(){Core.recurrence("2026-01-01","2026-12-31",EnumSet.allOf(DayOfWeek.class),true);}
    @Test(expected=IllegalArgumentException.class) public void recurrenceRequiresAWeekday(){Core.recurrence("2026-10-19","2026-10-20",Collections.emptySet(),true);}
    @Test public void validSameDaySession(){Core.validateSession("22:00",60);}
    @Test(expected=IllegalArgumentException.class) public void midnightEndIsRejected(){Core.validateSession("23:00",60);}
    @Test(expected=IllegalArgumentException.class) public void crossMidnightIsRejected(){Core.validateSession("23:30",45);}
    @Test public void disjointGoalsHaveNoIntersection(){assertNull(Core.intersection("2026-01-01","2026-01-31","2026-02-01","2026-03-01"));}
    @Test public void intersectionsAreClipped(){assertArrayEquals(new String[]{"2026-01-10","2026-01-20"},Core.intersection("2026-01-01","2026-01-20","2026-01-10","2026-01-31"));}
}
