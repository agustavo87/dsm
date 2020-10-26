/**
 *      SOURCE PROVIDER
 *
 **/
import SourceModel from './SourceModel'

const   MAX_PAGE_SIZE = 20,
        MIN_PAGE_SIZE = 1;

class SourcesProvider {
    constructor(sources) {
        this.sources = [];
        sources.forEach((source) => {
            this.put(source);
        })
    }

    index(size, page) {
        let N, remainder_size, pages_full, n_pages;

        if (size > MAX_PAGE_SIZE ) {
            size = MAX_PAGE_SIZE;
        } else if (size < MIN_PAGE_SIZE) {
            size = MIN_PAGE_SIZE;
        }

        N = this.sources.length;
        pages_full = Math.floor(N / size);
        remainder_size = N % size;
        n_pages = pages_full + (remainder_size ? 1: 0);

        let min = (page-1) * size;

        let range = {
            min: min,
            max: (remainder_size && page === n_pages) ? (min - 1) + remainder_size : (min - 1)  + size
        };

        return {
            N:N,
            size:size,
            page_total: n_pages,
            page_current:page,
            remainder_page_size: remainder_size,
            range: range,
            data: this._range(range.min, range.max, true)
        };
    }

    get length () {
        return this.sources.length;
    }

    _range (min, max, abstract) {
        let data = [];
        if (abstract) {
            for (let i = min; i <= max; i++) {
                data.push({
                    author: this.sources[i].author,
                    year: this.sources[i].year,
                    title: this.sources[i].title,
                    id:this.sources[i].id
                });
            }
        }
        return data;
    }

    get(request) {
        if (Array.isArray(request)) {
            return this.sources.filter(source => request.includes(source.id));
        }
        let i = this.sources.findIndex(source => source.id === request);
        return this.sources[i];
    }

    get_range(min, max) {
        if (min < 0 || max > (this.sources.length -1)) {
            console.log('error, pedido fuera de rango. Min: ' + min + ' max: ' + max);
            return false;
        }
        return this.sources.slice(min, max);
    }

    put(data, key = false) {
       let i = this.sources.push(new SourceModel(data)) - 1;
       key = key ? key : i;
       this.sources[i]['id'] = String(key);
    }

    update(key, data) {
        let target = this.sources[key];
        for (let property in data) {
            if (property in target) {
                target[property] = data[property];
            }
        }
    }
}

const testSources = [
    {
        author: "Gustavo Ayala",
        year: 1998,
        title: "Mas allá del horizonte",
        editorial: "No, manzana",
        abstract: "Era más de lo esperado. Pero no se esperaba eso. Por lo tanto, rompió en llanto. Aunque estuviera " +
            "ella."
    }, {
        author: "Repeto, Salasio",
        year: 1898,
        title: "Sin amor y sin gloria",
        editorial: "No, manzana",
        abstract: "Era más de lo esperado. Pero no se esperaba eso. Por lo tanto, rompió en llanto. Aunque estuviera " +
            "ella."
    }, {
        author: "Permiso, Santichudo",
        year: 2005,
        title: "Perteneces a donde no existes",
        editorial: "No, manzana",
        abstract: "Era más de lo esperado. Pero no se esperaba eso. Por lo tanto, rompió en llanto. Aunque estuviera " +
            "ella."
    }, {
        author: "Perez, Eloisa",
        year: 1987,
        title: "Maria, y las aventras de caperucita morocha",
        editorial: "No, manzana",
        abstract: "Era más de lo esperado. Pero no se esperaba eso. Por lo tanto, rompió en llanto. Aunque estuviera " +
            "ella."
    }, {
        author: "Cachito, Montana",
        year: 2012,
        title: "Pepito y su pepa, la venganza.",
        editorial: "No, manzana",
        abstract: "Era más de lo esperado. Pero no se esperaba eso. Por lo tanto, rompió en llanto. Aunque estuviera " +
            "ella."
    }, {
        author: "Laturaro, de la Vega",
        year: 2012,
        title: "Sandia bendita, a la vuelta de la esquina.",
        editorial: "No, manzana",
        abstract: "Era más de lo esperado. Pero no se esperaba eso. Por lo tanto, rompió en llanto. Aunque estuviera " +
            "ella."
    }, {
        author: "Patito, Belomento",
        year: 2012,
        title: "Miscelaneas de mi vida.",
        editorial: "No, manzana",
        abstract: "Era más de lo esperado. Pero no se esperaba eso. Por lo tanto, rompió en llanto. Aunque estuviera " +
            "ella."
    }
];

export {SourcesProvider as default, testSources};
