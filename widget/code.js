"use strict";
let container = null;
let enginesEl = null;
let maxIdx = "1";
let numberOfEngines = 0;
let engines = {};
this.store = {
    active: false,
    use_metric: false,
};
this.$api.datastore.import(this.store);
const farenheitToCelcius = (f) => (f - 32) * (5 / 9);
const maybeConvertTemperature = (f) => {
    if (this.store.use_metric) {
        return farenheitToCelcius(f);
    }
    return f;
};
const displayTemp = (t) => {
    return `${Math.round(t * 10) / 10}${this.store.use_metric ? 'C' : 'F'}`;
};
const initEngines = () => {
    engines = {
        max: {
            idx: 'max',
            max: 0,
            maxMix: 100,
            diff: 0,
            currentMix: 'Rich',
            element: null,
            temp: 0
        }
    };
    numberOfEngines = this.$api.variables.get('A:NUMBER OF ENGINES', 'number');
    for (let i = 1; i <= numberOfEngines; i++) {
        engines[`${i}`] = {
            idx: i,
            max: 0,
            maxMix: 100,
            diff: 0,
            currentMix: 'Rich',
            element: null,
            temp: 0
        };
    }
};
const setEngineVar = (engine, field, value) => {
    if (!enginesEl) {
        return;
    }
    const el = enginesEl.querySelector(`#engine-${engine}-${field}`);
    if (!el) {
        return;
    }
    el.innerHTML = value;
};
const maybeCreateEngineElement = (item) => {
    if (item.element) {
        return item.element;
    }
    item.element = (enginesEl === null || enginesEl === void 0 ? void 0 : enginesEl.querySelector(`#engine-${item.idx}`)) || null;
    if (!item.element) {
        item.element = document.createElement('div');
        item.element.setAttribute('data-engine', `${item.idx}`);
        item.element.setAttribute('id', `engine-${item.idx}`);
        item.element.classList.add('engine');
        item.element.innerHTML = `
            <span class="no">ENG ${item.idx}</span>
            <span class="temp" id="engine-${item.idx}-temp"></span>
            <span class="diff" id="engine-${item.idx}-diff"></span>
            <span class="richlean" id="engine-${item.idx}-richlean"></span>
        `;
        enginesEl === null || enginesEl === void 0 ? void 0 : enginesEl.appendChild(item.element);
    }
    return item.element;
};
const update = () => {
    var _a;
    if (!this.store.active) {
        return;
    }
    if (!container || !enginesEl) {
        return;
    }
    if (!numberOfEngines) {
        initEngines();
    }
    Object.keys(engines).forEach((key) => {
        if (key === "max") {
            return;
        }
        const item = engines[key];
        item.element = maybeCreateEngineElement(item);
        let temp = this.$api.variables.get(`A:GENERAL ENG EXHAUST GAS TEMPERATURE:${item.idx}`, 'rankine');
        temp = maybeConvertTemperature(temp - 460);
        let mixture = this.$api.variables.get(`A:GENERAL ENG MIXTURE LEVER POSITION:${item.idx}`, 'percent');
        if (item.max === null || item.maxMix === null) {
            item.max = temp;
            item.maxMix = mixture;
        }
        if (temp > item.max) {
            item.max = temp;
            item.maxMix = mixture;
        }
        if (mixture < item.maxMix) {
            item.currentMix = 'Lean';
        }
        else {
            item.currentMix = 'Rich';
        }
        item.diff = temp - item.max;
        item.temp = temp;
        setEngineVar(`${item.idx}`, "temp", displayTemp(item.temp));
        setEngineVar(`${item.idx}`, 'diff', displayTemp(item.diff));
        setEngineVar(`${item.idx}`, 'richlean', item.currentMix);
    });
    engines.max.element = maybeCreateEngineElement(engines.max);
    if (numberOfEngines > 1) {
        maxIdx = Object.keys(engines).filter(key => key !== "max").reduce((acc, key) => {
            const item = engines[key];
            if (acc.max === 0) {
                return {
                    idx: key,
                    max: item.max
                };
            }
            if (item.max > acc.max) {
                return {
                    idx: key,
                    max: item.max
                };
            }
            return acc;
        }, {
            idx: "1",
            max: 0
        }).idx;
        engines.max = Object.assign(Object.assign({}, engines.max), { temp: engines[maxIdx].temp, diff: engines[maxIdx].diff, max: engines[maxIdx].max, maxMix: engines[maxIdx].maxMix, currentMix: engines[maxIdx].currentMix });
        setEngineVar('max', 'title', `MAX (${maxIdx})`);
        setEngineVar("max", "temp", displayTemp(engines.max.temp));
        setEngineVar('max', 'diff', displayTemp(engines.max.diff));
        setEngineVar('max', 'richlean', engines.max.currentMix);
        if (engines.max.element && engines.max.element.classList.contains("hidden")) {
            engines.max.element.classList.remove("hidden");
        }
    }
    else {
        if (((_a = engines.max) === null || _a === void 0 ? void 0 : _a.element) && !engines.max.element.classList.contains("hidden")) {
            engines.max.element.classList.add("hidden");
        }
    }
};
run(() => {
    this.store.active = !this.store.active;
    this.$api.datastore.export(this.store);
    maxIdx = "1";
    initEngines();
    update();
});
html_created(() => {
    container = document.querySelector('#ranbogmord-leanassist');
    if (container) {
        enginesEl = container.querySelector('#engines');
    }
});
style(() => {
    if (container) {
        if (this.store.active) {
            container.classList.add('visible');
        }
        else {
            container.classList.remove('visible');
        }
    }
    return this.store.active ? 'active' : null;
});
settings_define({
    use_metric: {
        type: 'checkbox',
        label: 'Use metric',
        value: this.store.use_metric,
        changed: (value) => {
            this.store.use_metric = value;
            this.$api.datastore.export(this.store);
        }
    }
});
loop_15hz(() => {
    update();
});
