import SourceBlot from '../../../quill/blots/source';

describe('creación de SourceBlot.', () => {
    const key = 'a2';
    const type = 'reference';
    let sbNode = {};
    let mySB = {};
    beforeAll(() => {
        sbNode = SourceBlot.create({key: key, type: type});
        mySB = new SourceBlot(sbNode);
    });

    it('crea nodos con propiedades dataset (key, type) correctamente', () => {
        expect(sbNode.dataset.key).toBe(key);
        expect(sbNode.dataset.type).toBe(type);
    });

    it('Tiene el nodo establecido correctamente', () => {
        expect(mySB.domNode).toBe(sbNode);

    });

    it('devuelve valores de modo correcto', () => {
        expect(SourceBlot.value(sbNode)).toEqual({key:key,type:type});
    });

    it('Actualiza la propiedad id de cada blot de forma correcta', () => {
        const sbNode2 = SourceBlot.create({key: key, type: type});
        const mySB2 = new SourceBlot(sbNode2);
        expect(mySB.id).toBe(0);
        expect(mySB2.id).toBe(1);
    });

});
