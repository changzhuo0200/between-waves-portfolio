(() => {
  const targets = [...document.querySelectorAll('.reveal')];
  const showAll = () => targets.forEach((target) => target.classList.add('is-visible'));
  const workflow = document.querySelector('.workflow');
  const workflowDetail = document.querySelector('.workflow-detail');
  const workflowSteps = workflow ? [...workflow.querySelectorAll('li')] : [];
  let workflowTimers = [];

  const activateWorkflowStep = (step, userInitiated = false) => {
    if (!step || !workflowDetail) return;
    if (userInitiated) {
      workflowTimers.forEach(clearTimeout);
      workflowTimers = [];
    }
    workflowSteps.forEach((item) => {
      const active = item === step;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    workflowDetail.querySelector('span').textContent = step.querySelector('b').textContent;
    workflowDetail.querySelector('strong').textContent = step.dataset.workflowDetail;
  };

  workflowSteps.forEach((step) => {
    step.addEventListener('pointerenter', () => activateWorkflowStep(step, true));
    step.addEventListener('focus', () => activateWorkflowStep(step, true));
    step.addEventListener('click', () => activateWorkflowStep(step, true));
    step.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      activateWorkflowStep(step, true);
    });
  });
  activateWorkflowStep(workflowSteps[0]);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      if (entry.target.matches('[data-workflow]') && workflowSteps.length) {
        workflowTimers = workflowSteps.map((step, index) => setTimeout(() => activateWorkflowStep(step), 180 + index * 240));
      }
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  targets.forEach((target) => observer.observe(target));
})();
