/**
 * Runs before first paint to apply saved display preferences, preventing a
 * flash of the wrong palette/contrast/size. Kept tiny and dependency-free;
 * the source of truth for each value is localStorage, written by
 * <ThemeToggle /> (`dyni-theme`: "dark" | "light") and Settings > Display
 * (`dyni-contrast`: "1" | "0", `dyni-font-size`: "sm" | "md" | "lg" | "xl" —
 * see components/theme/displayPrefs.ts). With no saved value, theme falls
 * back to the OS preference (CSS) and contrast/font-size fall back to the
 * defaults (no attribute set).
 */
export default function DisplayPrefsScript() {
  const js = `(function(){try{
    var t=localStorage.getItem('dyni-theme');
    if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}
    var c=localStorage.getItem('dyni-contrast');
    if(c==='1'){document.documentElement.setAttribute('data-contrast','high');}
    var f=localStorage.getItem('dyni-font-size');
    if(f==='sm'||f==='lg'||f==='xl'){document.documentElement.setAttribute('data-font-size',f);}
  }catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
