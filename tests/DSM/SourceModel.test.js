import SourceReferencesModel from '../../DSM/SourceReferencesModel';
import Reference from '../../DSM/Reference';
import minBy from 'lodash/minBy';

jest.mock('../../quill/blots/source');
jest.mock('../../DSM/Reference', () => {
    return {
        __esModule: true,
        default: jest.fn(() => {
            let Reference = {
                blot: {}
            };
            Object.defineProperty(Reference, 'index', {
                get: jest.fn(),
                configurable: true
            });
            Reference.id = ++mockStatic.Reference.lastId;
            return Reference
        }),
    };
});

const mockStatic = {
    Reference: {
        lastId: -1
    }
};

test('construir sin key tira error', () => {
    expect(() => new SourceReferencesModel()).toThrow();
});

test('devuevle la key correctamente', () => {
    const myKey = 'a2';
    const mySM = new SourceReferencesModel(myKey);
    expect(mySM.key).toBe(myKey);
});

it('Devuelve lista sombra',() => {

});

describe('validación de índice j', () => {
    const myKey = 'a2';
    const mySM = new SourceReferencesModel(myKey);
    const myRef = new Reference();
    beforeAll(() => {
        mySM.put(myRef);
    });
    it('buscar sin un número tira error', () => {
        expect(() => mySM.getByJ('0')).toThrow();
    });

    it('buscar fuera del índice tira error', () => {
        expect(() => mySM.getByJ(2)).toThrow();
    });

    it('devuelve correctamente referencia', () => {
        expect(mySM.getByJ(0)).toBe(myRef);
    });
});


it('Reference index mock works', () => {
    Reference.mockClear();

    const blotIndexes = [10,5,29];
    const myRefs = [];
    blotIndexes.forEach(blotIndex => {
        let i = myRefs.push(new Reference()) -1 ;
        Object.defineProperty(myRefs[i], 'index', {
            get: jest.fn().mockReturnValue(blotIndex)
        });
    });

    blotIndexes.forEach((blotIndex, i) => {
        expect(myRefs[i].index).toBe(blotIndexes[i]);
    })

});

it('Reference id mock works', () => {
    mockStatic.Reference.lastId = -1;
    Reference.mockClear();

    let myRef = new Reference();
    expect(myRef.id).toBe(0);

    let myRef2 = new Reference();
    expect(myRef2.id).toBe(1);
});

describe('Asignación de primero', () => {
    const myKey = 'a2';
    let mySM = {};
    const Refs = [];
    const blotIndexes = [5, 2, 55, 1];

    beforeAll(() => {
        Reference.mockClear();
        blotIndexes.forEach(blotIndex => {
            let i = Refs.push(new Reference()) -1 ;
            Object.defineProperty(Refs[i], 'index', {
                get: jest.fn().mockReturnValue(blotIndex)
            });
        });
    });

    beforeEach(() => {
       mySM = new SourceReferencesModel(myKey);
    });

    it('propiedad length correcta', () => {
        Refs.forEach(Ref => {
            mySM.put(Ref);
        });
        expect(mySM.length).toBe(Refs.length);
    });

    it('Almacena la referencia más pequeña', () => {
        Refs.forEach(Ref => {
            mySM.put(Ref);
        });
        expect(mySM.first.index).toBe(1);
    });

    it('Devuelve lista sombra', () => {
        Refs.forEach(Ref => {
            mySM.put(Ref);
        });

        const myList = mySM.list;
        let j1 = myList.length - 1, j2 = mySM.length - 1;
        expect(myList[j1]).toBe(mySM.getByJ(j2));

        myList.push(new Reference());
        j1 = myList.length - 1; j2 = mySM.length - 1;
        expect(myList[j1]).not.toBe(mySM.getByJ(j2));

    });

    it('Remover el primero y reestablecer el primero', () => {
        Refs.forEach(Ref => {
            mySM.put(Ref);
        });
        expect(mySM.removeByJ(3)).toBe(true);
        expect(mySM.first).toBe(mySM.getByJ(1));
    });

    it('minBy', () => {
        let objects = [{ 'n': 1 }, { 'n': 2 }];

        let result = minBy(objects, function(o) { return o.n; });
        // => { 'n': 1 }

        expect(result).toBe(objects[0]);
    });

    it('obtener por id', () => {
        Refs.forEach(Ref => {
            mySM.put(Ref);
        });
        expect(mySM.get(Refs[2].id)).toBe(Refs[2]);
        expect(mySM.get(Refs[0].id)).toBe(Refs[0]);
    });

    it('remover por id', () => {
        Refs.forEach(Ref => {
            mySM.put(Ref);
        });
        expect(mySM.remove(Refs[2].id)).toBe(false);
        expect(mySM.get(Refs[2].id)).toBeUndefined();
        expect(mySM.remove(Refs[3].id)).toBe(true); // era un primero.
        expect(mySM.first.id).toBe(Refs[1].id) // el segundo menor.
    })
});
