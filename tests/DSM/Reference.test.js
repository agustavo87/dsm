import Reference from '../../DSM/Reference';
// import Reference from '../../modules/DSM/Reference'
import SourceBlot from '../../quill/blots/source';
// import SourceBlot from '../../quill/blots/source';
import Quill from '../../quill/quill';
// import Quill from '../../quill/quill';


jest.mock('../../quill/quill');
jest.mock('../../quill/blots/source');


test('Error al construir sin blot', () => {
    expect(() => {new Reference()}).toThrow();
});

test('Construcción correcta', () => {
    const quill = new Quill();
    expect(new Reference(new SourceBlot(), quill)).toBeInstanceOf(Reference);
});

test('Obtención de blot', () => {
    const quill = new Quill();
    const mySource = new SourceBlot();
    const myReference = new Reference(mySource, quill);
    expect(myReference.blot).toBe(mySource);
});

test('Error al crear referencia sin quill inyectado', () => {

   expect(() => {new Reference(new SourceBlot())}).toThrow();
});

test('Mock de Quill.getIndex', () => {
    const quill = new Quill();
    // console.log(quill);
    expect(quill.getIndex()).toBeUndefined();

    quill.getIndex.mockReturnValue(5);
    expect(quill.getIndex()).toBe(5);
});

test('Inyección de instancia de Quill y obtención de índice', () => {
    const quill = new Quill();
    quill.getIndex.mockReturnValue(5);
    // expect(quill.getIndex()).toBe(5);
    //
    Reference.quill = quill;
    // expect(Reference.quill.getIndex()).toBe(5);

    const myRef = new Reference(new SourceBlot());
    expect(myRef.index).toBe(5);
});


describe('Propiedades del SourceBlot', () => {
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
        // expect(quill.getIndex()).toBe(5);
        //
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

    it('Propiedades del Mock SourceBlot creadas correctamente', () => {
       expect(mySB.domNode).toBe(sbNode);
       expect(mySB.mounted).toBe(true);
       expect(mySB.id).toBeGreaterThanOrEqual(0);
    });

    it('Mock de SourceBlot creado correctamente. Valores se obtienen de modo correcto', () => {
        expect(Object.values(SourceBlot.value(sbNode))).toEqual(
            expect.arrayContaining([key,type])
        );
    });

    it('Propiedades (sourceKey, sourceType, id) de Referencia se acceden correctamente)', () => {
        myRef = new Reference(mySB);
        expect(myRef.key).toBe(key);
        expect(myRef.type).toBe(type);
        expect(myRef.id).toBeGreaterThanOrEqual(0);
        // console.log('myRef.id:',myRef.id);
    });
});
