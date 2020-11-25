interface IFocusableElement {
    nativeElement: Element;
    tabIndex?: string;
}

export const tabNavigation = new InjectionToken<ITabNavigationService>(
    "disable/restore tab navigation behavior"
);

interface ITabNavigationService {
	disableTabNavigation(domElRef: ElementRef): void;
	restoreTabNavigation(): void;
}

class TabNavigationService implements ITabNavigationService {
	// cache to remember the altered DOM elements that will be later restored
	private TabNavigationService: IFocusableElement[] = [];

	public disableTabNavigation(domElRef: ElementRef) {
		// dom manipulation to cache the altered elements
		// and do tabIndex=-1 on focusable HTML elements
		this.TabNavigationService = [];
            domElRef.nativeElement
                .querySelectorAll(focusableElementsCSSSelector)
                .forEach((domElRef: Element) => {
                    this.TabNavigationService.push({
                        nativeElement: domElRef,
                        tabIndex: domElRef.getAttribute("tabindex"),
                    });

                    // disable focusing element via tab
                    domElRef.setAttribute("tabindex", "-1");
                });
	}
	
	public restoreTabNavigation() {
		// dom manipulation to restore the tabIndex for the cached elements
		// and remove the tabIndex for those who didn't had it at all
		// restore elements tabindex
            this.TabNavigationService.forEach(e => {
                if (e?.tabIndex?.length) {
                    e.nativeElement.setAttribute("tabindex", e.tabIndex);
                } else {
                    e.nativeElement.removeAttribute("tabindex");
                }
            });
	}
}

A. Indivual components aproach
==============================
All our controllable components, but NOT HTML elements and other 3rd party components
will NOT use that inject token and to disable/restore focusable elements


B. BusyComponent API aproach
============================
All our controllable components, but NOT HTML elements and other 3rd party components
will NOT call .disable/restore focusable elements via BusyComponent API

@Component({
	selector: "[nui-busy]",
}){
	public disableTabNavigation (domElRef: ElementRef) { ... }
	public restoreTabNavigation() { ... }
}

C. BusyComponent inject token aproach
=====================================
export const tabNavigation = new InjectionToken<ITabNavigationService>(
    "disable/restore tab navigation behavior"
);

@Component({
	selector: "[nui-busy]",
	providers: [
		{
			provide: tabNavigation,
			useClass: TabNavigationService
		}
	],
	// other things ...
})
export class BusyComponent {
  // ...
  
  constructor(
	@Inject(TabNavigationToken) TabNavigationService: ITabNavigationService,
	private elRef: ElementRef
  ) {
  
  @Input() public set busy(value: boolean) {
	if (value) {
		this.TabNavigationService.disableTabNavigation(this.elRef.nativeElement);
	} else {
		this.TabNavigationService.restoreTabNavigation();
	}
  }
}

D. BusyComponent abstract class DI token
// there's really no point for abstraction here
// since we know what we want and we actually implement it below
abstract class AbstractFocusableElements {
	abstract disableTabNavigation(domElRef: ElementRef): void;
	abstract restoreTabNavigation(): void;
}

class TabNavigationService extends AbstractFocusableElements {
	public disableTabNavigation(domElRef: ElementRef) {
		// dom manipulation to cache the altered elements
		// and do tabIndex=-1 on focusable HTML elements
	}
	
	public restoreTabNavigation() {
		// dom manipulation to restore the tabIndex for the cached elements
		// and remove the tabIndex for those who didn't had it at all
	}
}

@Component({
	selector: "[busy-component]",
	providers: [
		// For this application, let's provide the MeanGreeter instance when the
		// Greeter needs to be injected into the App component.
		{
			provide: AbstractFocusableElements,
			useClass: TabNavigationService
		}
	],
	// ...
})
export class BusyComponent {
  // ...
  
  constructor(
	TabNavigationService: ITabNavigationService, 
	private elRef: ElementRef
  ) {}
  
  @Input() public set busy(value: boolean) {
	if (value) {
		this.TabNavigationService.disableTabNavigation(this.elRef.nativeElement);
	} else {
		this.TabNavigationService.restoreTabNavigation();
	}
  }
}

E. BusyComponent Limit service scope
====================================
@Component({
	selector: "[busy-component]",
	providers: [TabNavigationService]
})
export class BusyComponent {
  // ...
  
  constructor(
	TabNavigationService: TabNavigationService, 
	private elRef: ElementRef
  ) {}
  
  @Input() public set busy(value: boolean) {
	if (value) {
		this.TabNavigationService.disableTabNavigation(this.elRef.nativeElement);
	} else {
		this.TabNavigationService.restoreTabNavigation();
	}
  }
}
<div id="nui-demo-busy-host" nui-busy [busy]="busy">
    <a href="">
	<div>
        <nui-checkbox i18n>
            Attempts to change my checked state will fail when busy is enabled
        </nui-checkbox>
    </div>
</div>


