
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    const seen_callbacks = new Set();
    function flush() {
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/Copy.svelte generated by Svelte v3.18.1 */

    const { console: console_1 } = globals;
    const file = "src/Copy.svelte";

    // (29:0) {#if valueCopy != null}
    function create_if_block(ctx) {
    	let textarea;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			textarea.value = /*valueCopy*/ ctx[0];
    			attr_dev(textarea, "class", "svelte-17t11bw");
    			add_location(textarea, file, 29, 2, 633);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    			/*textarea_binding*/ ctx[4](textarea);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*valueCopy*/ 1) {
    				prop_dev(textarea, "value", /*valueCopy*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    			/*textarea_binding*/ ctx[4](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(29:0) {#if valueCopy != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t;
    	let svg;
    	let path;
    	let dispose;
    	let if_block = /*valueCopy*/ ctx[0] != null && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M2 13h4v1H2v-1zm5-6H2v1h5V7zm2 3V8l-3 3 3 3v-2h5v-2H9zM4.5 9H2v1h2.5V9zM2 12h2.5v-1H2v1zm9 1h1v2c-.02.28-.11.52-.3.7-.19.18-.42.28-.7.3H1c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1h3c0-1.11.89-2 2-2 1.11 0 2 .89 2 2h3c.55 0 1 .45 1 1v5h-1V6H1v9h10v-2zM2 5h8c0-.55-.45-1-1-1H8c-.55 0-1-.45-1-1s-.45-1-1-1-1 .45-1 1-.45 1-1 1H3c-.55 0-1 .45-1 1z");
    			add_location(path, file, 40, 2, 887);
    			attr_dev(svg, "title", "Copy to clipboard");
    			attr_dev(svg, "class", "octicon octicon-clippy svelte-17t11bw");
    			attr_dev(svg, "viewBox", "0 0 14 16");
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "width", "14");
    			attr_dev(svg, "height", "16");
    			attr_dev(svg, "aria-hidden", "true");
    			add_location(svg, file, 31, 0, 694);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    			dispose = listen_dev(svg, "click", /*copy*/ ctx[2], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*valueCopy*/ ctx[0] != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(svg);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let valueCopy = null;
    	let { value = null } = $$props;
    	let areaDom;

    	async function copy() {
    		$$invalidate(0, valueCopy = value);
    		await tick();
    		areaDom.focus();
    		areaDom.select();
    		let message = "Copying text was successful";

    		try {
    			const successful = document.execCommand("copy");

    			if (!successful) {
    				message = "Copying text was unsuccessful";
    			}
    		} catch(err) {
    			message = "Oops, unable to copy";
    		}

    		// we can notifi by event or storage about copy status
    		console.log(message);

    		$$invalidate(0, valueCopy = null);
    	}

    	const writable_props = ["value"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Copy> was created with unknown prop '${key}'`);
    	});

    	function textarea_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, areaDom = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(3, value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { valueCopy, value, areaDom };
    	};

    	$$self.$inject_state = $$props => {
    		if ("valueCopy" in $$props) $$invalidate(0, valueCopy = $$props.valueCopy);
    		if ("value" in $$props) $$invalidate(3, value = $$props.value);
    		if ("areaDom" in $$props) $$invalidate(1, areaDom = $$props.areaDom);
    	};

    	return [valueCopy, areaDom, copy, value, textarea_binding];
    }

    class Copy extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { value: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Copy",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get value() {
    		throw new Error("<Copy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Copy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-spinner/src/index.svelte generated by Svelte v3.18.1 */

    const file$1 = "node_modules/svelte-spinner/src/index.svelte";

    function create_fragment$1(ctx) {
    	let svg;
    	let circle;
    	let circle_stroke_dasharray_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			attr_dev(circle, "role", "presentation");
    			attr_dev(circle, "cx", "16");
    			attr_dev(circle, "cy", "16");
    			attr_dev(circle, "r", /*radius*/ ctx[4]);
    			attr_dev(circle, "stroke", /*color*/ ctx[2]);
    			attr_dev(circle, "fill", "none");
    			attr_dev(circle, "stroke-width", /*thickness*/ ctx[3]);
    			attr_dev(circle, "stroke-dasharray", circle_stroke_dasharray_value = "" + (/*dash*/ ctx[5] + ",100"));
    			attr_dev(circle, "stroke-linecap", "round");
    			add_location(circle, file$1, 19, 2, 384);
    			attr_dev(svg, "height", /*size*/ ctx[0]);
    			attr_dev(svg, "width", /*size*/ ctx[0]);
    			set_style(svg, "animation-duration", /*speed*/ ctx[1] + "ms");
    			attr_dev(svg, "class", "svelte-spinner svelte-1bbsd2f");
    			attr_dev(svg, "viewBox", "0 0 32 32");
    			add_location(svg, file$1, 12, 0, 253);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, circle);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*radius*/ 16) {
    				attr_dev(circle, "r", /*radius*/ ctx[4]);
    			}

    			if (dirty & /*color*/ 4) {
    				attr_dev(circle, "stroke", /*color*/ ctx[2]);
    			}

    			if (dirty & /*thickness*/ 8) {
    				attr_dev(circle, "stroke-width", /*thickness*/ ctx[3]);
    			}

    			if (dirty & /*dash*/ 32 && circle_stroke_dasharray_value !== (circle_stroke_dasharray_value = "" + (/*dash*/ ctx[5] + ",100"))) {
    				attr_dev(circle, "stroke-dasharray", circle_stroke_dasharray_value);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "height", /*size*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 1) {
    				attr_dev(svg, "width", /*size*/ ctx[0]);
    			}

    			if (dirty & /*speed*/ 2) {
    				set_style(svg, "animation-duration", /*speed*/ ctx[1] + "ms");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { size = 25 } = $$props;
    	let { speed = 750 } = $$props;
    	let { color = "rgba(0,0,0,0.4)" } = $$props;
    	let { thickness = 2 } = $$props;
    	let { gap = 40 } = $$props;
    	let { radius = 10 } = $$props;
    	let dash;
    	const writable_props = ["size", "speed", "color", "thickness", "gap", "radius"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Src> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("speed" in $$props) $$invalidate(1, speed = $$props.speed);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("thickness" in $$props) $$invalidate(3, thickness = $$props.thickness);
    		if ("gap" in $$props) $$invalidate(6, gap = $$props.gap);
    		if ("radius" in $$props) $$invalidate(4, radius = $$props.radius);
    	};

    	$$self.$capture_state = () => {
    		return {
    			size,
    			speed,
    			color,
    			thickness,
    			gap,
    			radius,
    			dash
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("speed" in $$props) $$invalidate(1, speed = $$props.speed);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("thickness" in $$props) $$invalidate(3, thickness = $$props.thickness);
    		if ("gap" in $$props) $$invalidate(6, gap = $$props.gap);
    		if ("radius" in $$props) $$invalidate(4, radius = $$props.radius);
    		if ("dash" in $$props) $$invalidate(5, dash = $$props.dash);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*radius, gap*/ 80) {
    			 $$invalidate(5, dash = 2 * Math.PI * radius * (100 - gap) / 100);
    		}
    	};

    	return [size, speed, color, thickness, radius, dash, gap];
    }

    class Src extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			size: 0,
    			speed: 1,
    			color: 2,
    			thickness: 3,
    			gap: 6,
    			radius: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Src",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get size() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get speed() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set speed(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get thickness() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set thickness(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gap() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gap(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get radius() {
    		throw new Error("<Src>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set radius(value) {
    		throw new Error("<Src>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.18.1 */
    const file$2 = "src/App.svelte";

    // (62:2) {#if shorturlcomplete}
    function create_if_block_2(ctx) {
    	let h2;
    	let a;
    	let t0;
    	let t1;
    	let updating_value;
    	let current;

    	function copy_value_binding(value) {
    		/*copy_value_binding*/ ctx[11].call(null, value);
    	}

    	let copy_props = {};

    	if (/*shorturlcomplete*/ ctx[1] !== void 0) {
    		copy_props.value = /*shorturlcomplete*/ ctx[1];
    	}

    	const copy = new Copy({ props: copy_props, $$inline: true });
    	binding_callbacks.push(() => bind(copy, "value", copy_value_binding));

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			a = element("a");
    			t0 = text(/*shorturlcomplete*/ ctx[1]);
    			t1 = space();
    			create_component(copy.$$.fragment);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "href", /*shorturlcomplete*/ ctx[1]);
    			add_location(a, file$2, 63, 6, 1344);
    			attr_dev(h2, "class", "svelte-eqw36");
    			add_location(h2, file$2, 62, 4, 1333);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, a);
    			append_dev(a, t0);
    			append_dev(h2, t1);
    			mount_component(copy, h2, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*shorturlcomplete*/ 2) set_data_dev(t0, /*shorturlcomplete*/ ctx[1]);

    			if (!current || dirty & /*shorturlcomplete*/ 2) {
    				attr_dev(a, "href", /*shorturlcomplete*/ ctx[1]);
    			}

    			const copy_changes = {};

    			if (!updating_value && dirty & /*shorturlcomplete*/ 2) {
    				updating_value = true;
    				copy_changes.value = /*shorturlcomplete*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			copy.$set(copy_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(copy.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(copy.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			destroy_component(copy);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(62:2) {#if shorturlcomplete}",
    		ctx
    	});

    	return block;
    }

    // (70:2) {#if validationerror}
    function create_if_block_1(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*validationmessage*/ ctx[3]);
    			attr_dev(p, "class", "error svelte-eqw36");
    			add_location(p, file$2, 70, 2, 1513);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*validationmessage*/ 8) set_data_dev(t, /*validationmessage*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(70:2) {#if validationerror}",
    		ctx
    	});

    	return block;
    }

    // (75:2) {#if loading}
    function create_if_block$1(ctx) {
    	let current;

    	const spinner = new Src({
    			props: {
    				size: "50",
    				speed: "750",
    				color: "#999",
    				thickness: "2",
    				gap: "40"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(spinner.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(spinner, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spinner.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spinner.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(spinner, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(75:2) {#if loading}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let input;
    	let t2;
    	let button;
    	let t4;
    	let p;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let current;
    	let dispose;
    	let if_block0 = /*shorturlcomplete*/ ctx[1] && create_if_block_2(ctx);
    	let if_block1 = /*validationerror*/ ctx[2] && create_if_block_1(ctx);
    	let if_block2 = /*loading*/ ctx[4] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "vurl";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "GO";
    			t4 = space();
    			p = element("p");
    			t5 = text(/*urlsanitized*/ ctx[5]);
    			t6 = space();
    			if (if_block0) if_block0.c();
    			t7 = space();
    			if (if_block1) if_block1.c();
    			t8 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(h1, "class", "svelte-eqw36");
    			add_location(h1, file$2, 52, 2, 1078);
    			input.required = true;
    			attr_dev(input, "placeholder", "Enter your long URL");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-eqw36");
    			add_location(input, file$2, 53, 2, 1094);
    			attr_dev(button, "class", "svelte-eqw36");
    			add_location(button, file$2, 59, 2, 1216);
    			attr_dev(p, "class", "sanitizedurl svelte-eqw36");
    			add_location(p, file$2, 60, 2, 1257);
    			attr_dev(main, "class", "svelte-eqw36");
    			add_location(main, file$2, 51, 0, 1069);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, input);
    			set_input_value(input, /*url*/ ctx[0]);
    			append_dev(main, t2);
    			append_dev(main, button);
    			append_dev(main, t4);
    			append_dev(main, p);
    			append_dev(p, t5);
    			append_dev(main, t6);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t7);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t8);
    			if (if_block2) if_block2.m(main, null);
    			current = true;

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[10]),
    				listen_dev(input, "keydown", /*onenter*/ ctx[6], false, false, false),
    				listen_dev(button, "click", /*geturl*/ ctx[7], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*url*/ 1 && input.value !== /*url*/ ctx[0]) {
    				set_input_value(input, /*url*/ ctx[0]);
    			}

    			if (!current || dirty & /*urlsanitized*/ 32) set_data_dev(t5, /*urlsanitized*/ ctx[5]);

    			if (/*shorturlcomplete*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t7);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*validationerror*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(main, t8);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*loading*/ ctx[4]) {
    				if (!if_block2) {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(main, null);
    				} else {
    					transition_in(if_block2, 1);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let url = "";
    	let apiurl = "https://vurl.ir/apiv1";
    	let redirecturl = "https://vurl.ir/";
    	let shorturlcomplete = false;
    	let validationerror = false;
    	let validationmessage = "";
    	let loading = false;

    	let onenter = e => {
    		if (e.keyCode == 13) {
    			geturl();
    		}
    	};

    	let geturl = () => {
    		if (url && url !== "") {
    			// TODO: remove this line after implement API
    			$$invalidate(2, validationerror = false);

    			$$invalidate(4, loading = true);
    			$$invalidate(1, shorturlcomplete = "");

    			fetch(apiurl, {
    				method: "POST",
    				body: new URLSearchParams(`url=${encodeURI(url)}`)
    			}).then(response => {
    				return response.text();
    			}).then(i => {
    				$$invalidate(1, shorturlcomplete = `${redirecturl}${i}`);
    				$$invalidate(4, loading = false);
    			}).catch(() => {
    				$$invalidate(2, validationerror = true);
    				$$invalidate(3, validationmessage = "Server Error");
    				$$invalidate(4, loading = false);
    			});
    		} else {
    			$$invalidate(2, validationerror = true);
    			$$invalidate(3, validationmessage = "Enter Your URL !!");
    		}
    	};

    	function input_input_handler() {
    		url = this.value;
    		$$invalidate(0, url);
    	}

    	function copy_value_binding(value) {
    		shorturlcomplete = value;
    		$$invalidate(1, shorturlcomplete);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("url" in $$props) $$invalidate(0, url = $$props.url);
    		if ("apiurl" in $$props) apiurl = $$props.apiurl;
    		if ("redirecturl" in $$props) redirecturl = $$props.redirecturl;
    		if ("shorturlcomplete" in $$props) $$invalidate(1, shorturlcomplete = $$props.shorturlcomplete);
    		if ("validationerror" in $$props) $$invalidate(2, validationerror = $$props.validationerror);
    		if ("validationmessage" in $$props) $$invalidate(3, validationmessage = $$props.validationmessage);
    		if ("loading" in $$props) $$invalidate(4, loading = $$props.loading);
    		if ("onenter" in $$props) $$invalidate(6, onenter = $$props.onenter);
    		if ("geturl" in $$props) $$invalidate(7, geturl = $$props.geturl);
    		if ("urlsanitized" in $$props) $$invalidate(5, urlsanitized = $$props.urlsanitized);
    	};

    	let urlsanitized;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*url*/ 1) {
    			 $$invalidate(5, urlsanitized = decodeURI(url).slice(0, 50));
    		}
    	};

    	return [
    		url,
    		shorturlcomplete,
    		validationerror,
    		validationmessage,
    		loading,
    		urlsanitized,
    		onenter,
    		geturl,
    		apiurl,
    		redirecturl,
    		input_input_handler,
    		copy_value_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
