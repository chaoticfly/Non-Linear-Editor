export namespace main {
	
	export class CompiledSection {
	    label: string;
	    content: string;
	    color: string;
	    category: string;
	    tags: string[];
	
	    static createFrom(source: any = {}) {
	        return new CompiledSection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.label = source["label"];
	        this.content = source["content"];
	        this.color = source["color"];
	        this.category = source["category"];
	        this.tags = source["tags"];
	    }
	}
	export class Config {
	    horizontalLines: number;
	    verticalLines: number;
	    showHorizontal: boolean;
	    showVertical: boolean;
	    backgroundColor: string;
	    snapThreshold: number;
	    canvasPadding: number;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.horizontalLines = source["horizontalLines"];
	        this.verticalLines = source["verticalLines"];
	        this.showHorizontal = source["showHorizontal"];
	        this.showVertical = source["showVertical"];
	        this.backgroundColor = source["backgroundColor"];
	        this.snapThreshold = source["snapThreshold"];
	        this.canvasPadding = source["canvasPadding"];
	    }
	}
	export class Marker {
	    id: string;
	    lineId: string;
	    position: number;
	    label: string;
	    content: string;
	    tags: string[];
	    category: string;
	    color: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Marker(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.lineId = source["lineId"];
	        this.position = source["position"];
	        this.label = source["label"];
	        this.content = source["content"];
	        this.tags = source["tags"];
	        this.category = source["category"];
	        this.color = source["color"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Project {
	    id: string;
	    name: string;
	    config: Config;
	    markers: Marker[];
	    compileSlots: string[];
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Project(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.config = this.convertValues(source["config"], Config);
	        this.markers = this.convertValues(source["markers"], Marker);
	        this.compileSlots = source["compileSlots"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RecentProject {
	    path: string;
	    name: string;
	    // Go type: time
	    openedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new RecentProject(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.openedAt = this.convertValues(source["openedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

