/** Evita parpadeo al cargar: aplica el tema guardado antes de hidratar React. */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('querybot_theme');var theme=t==='light'?'light':'dark';var r=document.documentElement;r.setAttribute('data-theme',theme);r.classList.toggle('dark',theme==='dark');r.classList.toggle('querybot-light',theme==='light');}catch(e){}})();`,
      }}
    />
  );
}
