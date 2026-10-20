import { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { downloadText, STORAGE_KEY } from './store';
import './styles.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean; recoveryMessage: string }> {
  state = { error: false, recoveryMessage: '' };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* User data must never be logged or transmitted. */ }
  recover = () => { try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) throw new Error('اطلاعات ذخیره‌شده‌ای در این مرورگر یافت نشد.'); downloadText(raw, 'daftar-setareh-recovery-original.json'); this.setState({ recoveryMessage: 'فایل اصلی برای بازیابی دریافت شد؛ این فایل را نگه دار.' }); } catch (error) { this.setState({ recoveryMessage: error instanceof Error ? error.message : 'حافظهٔ مرورگر در دسترس نیست.' }); } };
  render() { return this.state.error ? <main className="welcome recovery" dir="rtl"><h1>دفترت دست‌نخورده مانده است</h1><p>نمایش این بخش متوقف شد؛ صفحه را دوباره باز کن. اگر ادامه داشت، از تنظیمات مرورگر داده‌های سایت را پاک نکن.</p><button className="button primary" onClick={() => window.location.reload()}>بازکردن دوبارهٔ برنامه</button><button className="button" onClick={this.recover}>دریافت فایل اصلی برای بازیابی</button>{this.state.recoveryMessage && <p role="status">{this.state.recoveryMessage}</p>}</main> : this.props.children; }
}
const root = document.getElementById('root');
if (!root) throw new Error('Application root not found.');
createRoot(root).render(<ErrorBoundary><App /></ErrorBoundary>);
