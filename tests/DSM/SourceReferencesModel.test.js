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

it('Throws error when construed without key', () => {
    expect(() => new SourceReferencesModel()).toThrow();
});

it('Returns key', () => {
    const myKey = 'a2';
    const mySM = new SourceReferencesModel(myKey);
    expect(mySM.key).toBe(myKey);
});

describe('Validation of j index', () => {
    const myKey = 'a2';
    const mySM = new SourceReferencesModel(myKey);
    const myRef = new Reference();
    beforeAll(() => {
        mySM.put(myRef);
    });
    it('Throws if j is not a number.', () => {
        expect(() => mySM.getByJ('0')).toThrow();
    });

    it('Throws if j is out of range', () => {
        expect(() => mySM.getByJ(2)).toThrow();
    });

    it('Returns Reference if j exists', () => {
        expect(mySM.getByJ(0)).toBe(myRef);
    });
});


test('Reference index mock works', () => {
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

test('Reference id mock works', () => {
    mockStatic.Reference.lastId = -1;
    Reference.mockClear();

    let myRef = new Reference();
    expect(myRef.id).toBe(0);

    let myRef2 = new Reference();
    expect(myRef2.id).toBe(1);
});

describe('Modeling the reference positioned first', () => {
    const myKey = 'a2';
    /** @type {SourceReferencesModel} */
    let mySRRM;
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
       mySRRM = new SourceReferencesModel(myKey);
    });

    it('Returns correct length', () => {
        Refs.forEach(Ref => {
            mySRRM.put(Ref);
        });
        expect(mySRRM.length).toBe(Refs.length);
    });

    it('Returns Referece positioned first in the document', () => {
        Refs.forEach(Ref => {
            mySRRM.put(Ref);
        });
        expect(mySRRM.first.index).toBe(1);
        expect(mySRRM.first).toBe(Refs[3])
    });

    it('It returns shallow copy of References', () => {
        Refs.forEach(Ref => {
            mySRRM.put(Ref);
        });

        // It has the same elements
        const myList = mySRRM.list
        let j0_a = myList.length - 1
        let j0_b = mySRRM.length - 1
        expect(myList[j0_a]).toBe(mySRRM.getByJ(j0_b))

        // But is different a object.
        myList.push(new Reference());
        j0_a = myList.length - 1; j0_b = mySRRM.length - 1
        expect(myList[j0_a]).not.toBe(mySRRM.getByJ(j0_b))
    });

    it('Updates the first Reference when is removed', () => {
        Refs.forEach(Ref => {
            mySRRM.put(Ref);
        });
        expect(mySRRM.removeByJ(3)).toBe(true);
        expect(mySRRM.first).toBe(mySRRM.getByJ(1));
    });

    it('minBy', () => {
        let objects = [{ 'n': 1 }, { 'n': 2 }];

        let result = minBy(objects, function(o) { return o.n; });

        expect(result).toBe(objects[0]);
    });

    it('Returns Reference by its SourceBlot id', () => {
        Refs.forEach(Ref => {
            mySRRM.put(Ref);
        });
        expect(mySRRM.get(Refs[2].id)).toBe(Refs[2]);
        expect(mySRRM.get(Refs[0].id)).toBe(Refs[0]);
    });

    it('Removes References by its id', () => {
        Refs.forEach(Ref => {
            mySRRM.put(Ref);
        });
        expect(mySRRM.remove(Refs[2].id)).toBe(false);
        expect(mySRRM.get(Refs[2].id)).toBeUndefined();
        // True if removed item is positioned first in document.
        expect(mySRRM.remove(Refs[3].id)).toBe(true)
        // The first Reference is updated
        expect(mySRRM.first.id).toBe(Refs[1].id) 
    })
});
