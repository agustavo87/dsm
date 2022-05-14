import Reference from '../../DSM/Reference';
import SourceBlot from '../../quill/blots/source';
import Quill from '../../quill/quill';

jest.mock('../../quill/quill');
jest.mock('../../quill/blots/source');

it('Throws when created without SourceBlot', () => {
    expect(() => {new Reference()}).toThrow();
});

it('Throws when no valid Quill instance available', () => {
    expect(() => {new Reference(new SourceBlot())}).toThrow();
 });

it('Is constructed as expected when SourceBlot and Quill supplied', () => {
    const quill = new Quill();
    expect(new Reference(new SourceBlot(), quill)).toBeInstanceOf(Reference);
});

it('Gives the wrapped blot', () => {
    const quill = new Quill();
    const mySource = new SourceBlot();
    const myReference = new Reference(mySource, quill);
    expect(myReference.blot).toBe(mySource);
});

it('Quill getIndex mocked as expected.', () => {
    const quill = new Quill();
    expect(quill.getIndex()).toBeUndefined();

    quill.getIndex.mockReturnValue(5);
    expect(quill.getIndex()).toBe(5);
});

it('Inyects Quill and get correct index', () => {
    const quill = new Quill();
    quill.getIndex.mockReturnValue(5);

    Reference.quill = quill;

    const myRef = new Reference(new SourceBlot());
    expect(myRef.index).toBe(5);
});

describe('Gives propperties of SourceBlot', () => {
    const key = 'a2';
    const type = 'document.reference';
    let node = null;
    let sbNode = null;
    let mySB = null;
    let myRef = null;
    let quill = null;

    beforeAll(() => {
        quill = new Quill();
        quill.getIndex.mockReturnValue(5);
        
        Reference.quill = quill;

        SourceBlot.mockImplementation( function (node) {
            this.id = ++SourceBlot.lastId;
            this.domNode = node;
            this.mounted = true; // this happens on blot attached but here is simulated.
        });

        SourceBlot.create.mockImplementation((node) => {
            node.dataset.key = key;
            node.dataset.type = type;
            node.setAttribute('contenteditable','false');
            return node;
        });

        SourceBlot.value.mockImplementation((node) => {
            return {
                key: node.dataset.key,
                type: node.dataset.type
            }
        });

        node = document.createElement(SourceBlot.tagName);
        node.classList.add(SourceBlot.className);

        sbNode = SourceBlot.create(node);
        mySB = new SourceBlot(sbNode);

    });

    it('Souce Blot Mock gives (domNote, mounted, id) properties as expected', () => {
       expect(mySB.domNode).toBe(sbNode);
       expect(mySB.mounted).toBe(true);
       expect(mySB.id).toBeGreaterThanOrEqual(0);
    });

    it('SourceBlot Mock gives blot values as expected', () => {
        expect(Object.values(SourceBlot.value(sbNode))).toEqual(
            expect.arrayContaining([key,type])
        );
    });

    it('Properties (sourceKey, sourceType, id) of the Reference are returned as expected)', () => {
        myRef = new Reference(mySB);
        expect(myRef.key).toBe(key);
        expect(myRef.type).toBe(type);
        expect(myRef.id).toBeGreaterThanOrEqual(0);
        myRef.id
    });
});
