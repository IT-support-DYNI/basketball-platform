/**
 * Runs before first paint to apply the saved theme, preventing a flash of the
 * wrong palette. Kept tiny and dependency-free; the source of truth for the
 * value is localStorage key `dyni-theme` ("dark" | "light"), written by
 * <ThemeToggle />. With no saved value the CSS falls back to the OS preference.
 */
export default function ThemeScript() {
  const js = `(function(){try{var t=localStorage.getItem('dyni-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
