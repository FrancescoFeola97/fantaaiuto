export class ViewManager {
  constructor() {
    this.currentView = 'dashboard';
    this.views = new Map();
  }

  init() {
    this.initializeViews();
    return Promise.resolve();
  }

  initializeViews() {
    const viewElements = document.querySelectorAll('.view');
    viewElements.forEach(view => {
      this.views.set(view.id.replace('-view', ''), view);
    });
  }

  switchTo(viewName) {
    if (!this.views.has(viewName)) {
      console.warn(`View '${viewName}' not found`);
      return false;
    }

    this.views.forEach((element, name) => {
      element.classList.toggle('active', name === viewName);
    });

    this.currentView = viewName;
    
    document.dispatchEvent(new CustomEvent('fantaaiuto:viewChange', {
      detail: { from: this.currentView, to: viewName }
    }));

    return true;
  }

  getCurrentView() {
    return this.currentView;
  }

  isViewActive(viewName) {
    return this.currentView === viewName;
  }
}