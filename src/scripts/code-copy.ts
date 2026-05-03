// Adds a "copier" button to every <pre> in the post body.
// Re-runs on astro:page-load so it works across View Transitions.
function attachCopyButtons() {
  const blocks = document.querySelectorAll<HTMLPreElement>('.post-content pre');
  blocks.forEach((pre) => {
    let wrapper = pre.parentElement;
    if (!wrapper?.classList.contains('code-block-wrapper')) {
      wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
    }
    if (wrapper.querySelector('.code-copy-button')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy-button';
    btn.textContent = 'copier';
    btn.setAttribute('aria-label', 'Copier le code');

    btn.addEventListener('click', async () => {
      const code = pre.innerText.replace(/\n$/, '');
      try {
        await navigator.clipboard.writeText(code);
        btn.classList.add('copied');
        btn.textContent = 'copié';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.textContent = 'copier';
        }, 2000);
      } catch {
        btn.textContent = 'erreur';
        setTimeout(() => (btn.textContent = 'copier'), 2000);
      }
    });

    wrapper.appendChild(btn);
  });
}

attachCopyButtons();
document.addEventListener('astro:page-load', attachCopyButtons);
