let container = null;
let enginesEl = null;
let max = null;
let maxMix = null;
let diff = null;
let maxIdx = 1;
let currentMix = "rich";

let numberOfEngines = 0;
let engines = [];

this.store = {
    active: false,
    use_celsius: false
};

this.$api.datastore.import(this.store);

const fToC = f => (f - 32) * (5 / 9);
const displayTemp = t => {
    return `${Math.round(t * 10) / 10}F`;
};

const initEngines = () => {
    engines = [];

    numberOfEngines = this.$api.variables.get('A:NUMBER OF ENGINES', 'number');

    // engine index starts at 1
    for (let i = 1; i <= numberOfEngines; i++) {
        engines.push({
            idx: i,
            max: null,
            maxMix: null,
            diff: null,
            currentMix: 'rich',
            element: null
        })
    }
};

const update = () => {
    if (!this.store.active) {
        return;
    }

    if (!container || !enginesEl) {
        return;
    }

    if (!numberOfEngines) {
        initEngines();
    }

    engines.forEach((item) => {
        if (!item.element) {

            item.element = enginesEl.querySelector(`#engine-${item.idx}`);

            if (!item.element) {
                item.element = document.createElement('div');
                item.element.setAttribute('data-engine', item.index);
                item.element.setAttribute('id', `engine-${item.idx}`)
                item.element.classList.add('engine');
                item.element.innerHTML = `
                    <span class="no">ENG ${item.idx}</span>
                    <span class="temp" id="engine-${item.idx}-temp"></span>
                    <span class="diff" id="engine-${item.idx}-diff"></span>
                    <span class="richlean" id="engine-${item.idx}-richlean"></span>
                `
    
                enginesEl.appendChild(item.element);
            }
        }

        let temp = this.$api.variables.get(`A:GENERAL ENG EXHAUST GAS TEMPERATURE:${item.idx}`, 'rankine')
        temp -= 460;
        let mixture = this.$api.variables.get(`A:GENERAL ENG MIXTURE LEVER POSITION:${item.idx}`, 'percent');

        if (max === null || maxMix === null) {
            max = temp;
            maxMix = mixture;
        }

        if (temp > max) {
            max = temp;
            maxMix = mixture;
            maxIdx = item.idx;
        }

        if (mixture < maxMix) {
            currentMix = 'Lean';
        } else {
            currentMix = 'Rich';
        }
        diff = temp - max;

        if (item.idx === maxIdx) {
            enginesEl.querySelector(`#engine-max-title`).innerHTML = `MAX (${maxIdx})`;
            enginesEl.querySelector(`#engine-max-temp`).innerHTML = `${displayTemp(temp)}`;
            enginesEl.querySelector(`#engine-max-diff`).innerHTML = `${displayTemp(diff)}`;
            enginesEl.querySelector(`#engine-max-richlean`).innerHTML = `${currentMix}`;
        }

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
        } else {
            item.currentMix = 'Rich';
        }
        item.diff = temp - item.max;

        item.element.querySelector(`#engine-${item.idx}-temp`).innerHTML = `${displayTemp(temp)}`
        item.element.querySelector(`#engine-${item.idx}-diff`).innerHTML = `${displayTemp(item.diff)}`
        item.element.querySelector(`#engine-${item.idx}-richlean`).innerHTML = `${item.currentMix}`
    });
};

run(() => {
    this.store.active = !this.store.active;
    this.$api.datastore.export(this.store);

    max = null;
    maxMix = null;
    diff = null;
    maxIdx = 1;
    currentMix = "rich";

    initEngines();
    update();
});

html_created(() => {
    container = document.querySelector('#ranbogmord-leanassist');
    enginesEl = container.querySelector('#engines');
});

style(() => {
    if (container) {
        if (this.store.active) {
            container.classList.add('visible');
        } else {
            container.classList.remove('visible');
        }
    }

    return this.store.active ? 'active' : null;
});

// settings_define({
// 	use_celsius: {
// 		type: 'checkbox',
// 		label: 'Use metric',
// 		value: this.store.use_celsius,
// 		changed: (value) => {
// 			this.store.use_celsius = value;
// 			this.$api.datastore.export(this.store);
// 		}
// 	}
// })

loop_15hz(() => {
    update();
});
