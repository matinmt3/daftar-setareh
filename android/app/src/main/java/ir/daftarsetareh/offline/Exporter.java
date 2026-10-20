package ir.daftarsetareh.offline;

import android.app.*;
import android.content.*;
import android.graphics.*;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.*;
import android.print.*;
import android.text.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

/** User-selected files only; no storage, network or account permissions. */
final class Exporter {
    static final int SAVE_BACKUP=101,OPEN_BACKUP=102,SAVE_PDF=103;
    final MainActivity a; final Context appContext;final ExecutorService worker=Executors.newSingleThreadExecutor();
    String pendingBackup;byte[] pendingPdf;
    Exporter(MainActivity activity){a=activity;appContext=activity.getApplicationContext();}
    void post(Runnable action){a.runOnUiThread(()->{if(!a.isDestroyed()&&!a.isFinishing())action.run();});}
    void create(String mime,String filename,int request){Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType(mime);intent.putExtra(Intent.EXTRA_TITLE,filename);a.startActivityForResult(intent,request);}
    void backup(){pendingBackup=a.store.exportJson();create("application/json","daftar-setareh-"+Dates.today()+".json",SAVE_BACKUP);}
    void importBackup(){Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("*/*");intent.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"application/json","text/plain","application/octet-stream"});a.startActivityForResult(intent,OPEN_BACKUP);}
    void pdf(ReportData report){pendingPdf=buildPdf(report.lines);create("application/pdf","daftar-setareh-"+report.start+".pdf",SAVE_PDF);}
    void shareText(ReportData report){Intent intent=new Intent(Intent.ACTION_SEND);intent.setType("text/plain");intent.putExtra(Intent.EXTRA_SUBJECT,report.title);intent.putExtra(Intent.EXTRA_TEXT,report.text());a.startActivity(Intent.createChooser(intent,"اشتراک کارنامه"));}
    void result(int request,Uri uri){
        if(request==OPEN_BACKUP){worker.execute(()->{try{String data=readBounded(uri);Map<String,List<org.json.JSONObject>> records=a.store.validateBackup(data);int total=records.values().stream().mapToInt(List::size).sum();a.runOnUiThread(()->{if(!a.isDestroyed()&&!a.isFinishing())a.ui.confirm("جایگزینی دفتر از پشتیبان","فایل معتبر است: "+Dates.fa(total)+" رکورد. اطلاعات فعلی این دفتر جایگزین می‌شود. اگر لازم است ابتدا از دفتر فعلی پشتیبان بگیر. ادامه می‌دهی؟",()->restore(data));});}catch(Exception error){a.runOnUiThread(()->{if(!a.isDestroyed())a.ui.toast("بازیابی انجام نشد: "+error.getMessage());});}});return;}
        final byte[] bytes=request==SAVE_BACKUP&&pendingBackup!=null?pendingBackup.getBytes(StandardCharsets.UTF_8):request==SAVE_PDF?pendingPdf:null;
        if(bytes==null){a.ui.toast("خروجی آماده نیست؛ دوباره از داخل برنامه انتخاب کن.");return;}
        worker.execute(()->{try(OutputStream output=appContext.getContentResolver().openOutputStream(uri,"wt")){if(output==null)throw new IOException("محل انتخاب‌شده در دسترس نیست.");output.write(bytes);output.flush();post(()->a.ui.toast("فایل ذخیره شد."));}catch(Exception error){post(()->a.ui.toast("ذخیره انجام نشد: "+error.getMessage()));}});
    }
    void restore(String data){a.ui.toast("در حال بازیابی پشتیبان…");worker.execute(()->{Store storage=new Store(a.getApplicationContext());try{storage.importJson(data);a.runOnUiThread(()->{if(!a.isDestroyed()&&!a.isFinishing()){a.screen="home";a.refresh();a.ui.toast("پشتیبان با موفقیت بازیابی شد.");}});}catch(Exception error){a.runOnUiThread(()->{if(!a.isDestroyed())a.ui.toast("بازیابی انجام نشد: "+error.getMessage());});}finally{storage.close();}});}
    String readBounded(Uri uri)throws IOException{try(InputStream input=appContext.getContentResolver().openInputStream(uri);ByteArrayOutputStream output=new ByteArrayOutputStream()){if(input==null)throw new IOException("فایل باز نشد.");byte[] buffer=new byte[8192];int count,total=0;while((count=input.read(buffer))!=-1){total+=count;if(total>5_000_000)throw new IOException("فایل بزرگ‌تر از ۵ مگابایت است.");output.write(buffer,0,count);}return output.toString(StandardCharsets.UTF_8.name());}}
    static final class PdfResult {final byte[] bytes;final int pageCount;final List<Integer> included;PdfResult(byte[] bytes,int count,List<Integer> included){this.bytes=bytes;pageCount=count;this.included=included;}}
    byte[] buildPdf(List<String> lines){return renderPdf(lines,null).bytes;}
    static boolean selectedPage(int index,PageRange[] ranges){if(ranges==null)return true;for(PageRange range:ranges)if(index>=range.getStart()&&index<=range.getEnd())return true;return false;}
    PdfResult renderPdf(List<String> lines,PageRange[] ranges){
        PdfDocument document=new PdfDocument();PdfDocument.Page page=null;int pageNumber=0,y=0;boolean selected=false;List<Integer> included=new ArrayList<>();TextPaint paint=new TextPaint(Paint.ANTI_ALIAS_FLAG);paint.setTypeface(a.ui.font);paint.setColor(Ui.INK);
        try{for(int lineIndex=0;lineIndex<lines.size();lineIndex++){String raw=lines.get(lineIndex);for(int offset=0;offset<Math.max(1,raw.length());offset+=900){String text=raw.substring(offset,Math.min(raw.length(),offset+900));paint.setTextSize(lineIndex==0?21:13);StaticLayout layout=StaticLayout.Builder.obtain(text,0,text.length(),paint,515).setAlignment(Layout.Alignment.ALIGN_NORMAL).setTextDirection(TextDirectionHeuristics.RTL).setLineSpacing(5,1.15f).setIncludePad(false).build();if(pageNumber==0||y+layout.getHeight()>785){if(page!=null){document.finishPage(page);page=null;}selected=selectedPage(pageNumber,ranges);pageNumber++;y=50;if(selected){included.add(pageNumber-1);page=document.startPage(new PdfDocument.PageInfo.Builder(595,842,pageNumber).create());page.getCanvas().drawColor(Color.WHITE);Paint accent=new Paint();accent.setColor(Ui.PURPLE);page.getCanvas().drawRect(40,25,555,30,accent);}}if(selected&&page!=null){page.getCanvas().save();page.getCanvas().translate(40,y);layout.draw(page.getCanvas());page.getCanvas().restore();}y+=layout.getHeight()+15;}}
            if(page!=null)document.finishPage(page);Store.require(!included.isEmpty(),"هیچ صفحه‌ای در بازهٔ چاپ انتخاب نشده است.");ByteArrayOutputStream output=new ByteArrayOutputStream();document.writeTo(output);return new PdfResult(output.toByteArray(),pageNumber,included);
        }catch(IOException error){throw new IllegalStateException("ساخت PDF انجام نشد.",error);}finally{document.close();}
    }
    static PageRange[] writtenRanges(List<Integer> included){List<PageRange> result=new ArrayList<>();for(int i=0;i<included.size();i++){int first=included.get(i),last=first;while(i+1<included.size()&&included.get(i+1)==last+1)last=included.get(++i);result.add(new PageRange(first,last));}return result.toArray(new PageRange[0]);}
    void print(ReportData report){final PdfResult full=renderPdf(report.lines,null);PrintManager manager=(PrintManager)a.getSystemService(Context.PRINT_SERVICE);manager.print("دفتر ستاره • "+report.title,new PrintDocumentAdapter(){
        @Override public void onLayout(PrintAttributes oldAttributes,PrintAttributes newAttributes,CancellationSignal cancellation,LayoutResultCallback callback,Bundle extras){if(cancellation.isCanceled()){callback.onLayoutCancelled();return;}callback.onLayoutFinished(new PrintDocumentInfo.Builder("daftar-setareh.pdf").setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT).setPageCount(full.pageCount).build(),true);}
        @Override public void onWrite(PageRange[] pages,ParcelFileDescriptor destination,CancellationSignal cancellation,WriteResultCallback callback){worker.execute(()->{try(FileOutputStream output=new FileOutputStream(destination.getFileDescriptor())){if(cancellation.isCanceled()){callback.onWriteCancelled();return;}PdfResult selected=renderPdf(report.lines,pages);if(cancellation.isCanceled()){callback.onWriteCancelled();return;}output.write(selected.bytes);callback.onWriteFinished(writtenRanges(selected.included));}catch(Exception error){callback.onWriteFailed(error.getMessage());}});}
    },new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());}
}
