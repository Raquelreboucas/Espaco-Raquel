/* Aplica o tema salvo antes da página aparecer (evita o "piscar" claro/escuro). */
try { var t = localStorage.getItem('meu-espaco-tema'); if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); } catch (e) {}
