import DocumentSourcesModel from '../../DSM/DocumentSourcesModel';
import {SourceTypes} from '../../DSM/SourceTypes';
import Reference from '../../DSM/Reference';
import minBy from 'lodash/minBy';

import lgEvents, {lgTopics} from '../../utils/events.js';
import SourcesList from "../../DSM/SourcesList";

jest.mock('../../quill/blots/source');

// Pasar esto a un manual mock
jest.mock('../../DSM/Reference', function () {
    const modules = {
        __esModule: true,
        default: jest.fn(function (options) {
            const properties = {
                blot: {},
                key: 'a4',
                type: 'citation-document',
                index: 12
            };

            Object.assign(properties, options);
            const Ref = {};

            Ref._id = ++mockStatic.Reference.lastId;

            Object.defineProperty(Ref, 'blot', {
                get: jest.fn(() => {
                    return properties.blot
                })
            });
            Object.defineProperty(Ref, 'key', {
                get: jest.fn(() => properties.key)
            });
            Object.defineProperty(Ref, 'type', {
                get: jest.fn(() => properties.type)
            });
            Object.defineProperty(Ref, 'index', {
                get: jest.fn(() => properties.index)
            });
            Object.defineProperty(Ref, 'id', {
                get: jest.fn(function () {
                    return this._id
                })
            });
            return Ref;
        }),
    };
    modules.default.lastId = -1;
    return modules;
});

// observador particular
const mensajes = {
    guardar: jest.fn(
        function (type, topic, data) {
            this._msjs.push(
                {
                    type: type,
                    topic: topic,
                    data: data
                }
            )
        }
    ),
    _msjs: [],
    clear: function () {
        this._msjs = []
    }
};

const mockStatic = {
    Reference: {
        lastId: -1
    }
};

test('DocumentSourcesModel construido sin opcciones notifica error, sin suspender ejecución', () => {
    const mySM = new DocumentSourcesModel();
    expect(mySM.errored).toBe(true);
    expect(mySM.error).toBeInstanceOf(Error);
});

test('DocumentSourcesModel emite evento de error', () => {
    lgEvents.on('', lgTopics.ERROR, mensajes.guardar.bind(mensajes));
    const mySM = new DocumentSourcesModel();

    expect(mensajes.guardar).toBeCalled();
    expect(mensajes._msjs[0]).toMatchObject({
        type: '',
        topic: lgTopics.ERROR,
        data: {
            error: expect.any(Error)
        }
    })
});

function getRefs(data) {
    let myRefs = [];
    data.forEach(source => {
        source.indexes.forEach(index => {
            myRefs.push({
                key: source.key,
                index: index
            })
        })
    });
    myRefs = myRefs.map(refOptions => new Reference(refOptions));
    return myRefs;
}

const data = {
    _list: []
}; // this may be the data of a view
const mockGet = jest.fn(function () {
    return this._list;
});
const mockSet = jest.fn(function (value) {
    this._list = value;
    // console.log('list updated:', this._list)
});
Object.defineProperty(data, 'list', {
    set: mockSet,
    get: mockGet
});

describe('Reference', () => {
    let myDSM = null;
    lgEvents.onAny(mensajes.guardar, mensajes);

    beforeEach(() => {
        myDSM = new DocumentSourcesModel(SourceTypes.CITATION_DOCUMENT);
        mensajes.clear();
        mensajes.guardar.mockClear();
        Reference.mockClear();
        mockStatic.Reference.lastId = -1;
        mockSet.mockClear();
        mockGet.mockClear();
        data._list = [];

    });

    afterEach(() => {
        lgEvents.clear(myDSM.type, lgTopics.SOURCE_ORDER_CHANGE);
        lgEvents.clear(myDSM.type, lgTopics.SOURCE_REFERENCE_REMOVED);
        lgEvents.clear(myDSM.type, lgTopics.SOURCE_REFERENCE_ADDED_REORDERED);
        lgEvents.clear(myDSM.type, lgTopics.SOURCE_REFERENCE_ADDED);


    });

    describe('asignación y orden', () => {

        it('Da error al asignar tipo incorrecto de referencia', () => {

            const myRef = new Reference({type: 'tipo.inexistente'});
            expect(myDSM.put(myRef)).toBeLessThan(0);
            expect(mensajes.guardar).toBeCalled();
            // console.log('Mensaje al asignar tipo incorrecto de referencia', mensajes._msjs[0]);
        });

        it('Asignación inicial de Referencia', () => {
            const myRef = new Reference();
            let i = myDSM.put(myRef);
            expect(i).toBe(0);
            expect(
                Object.getOwnPropertyDescriptor(myRef, 'index').get
            ).toBeCalled();
        });

        it('Asignación de Referencia. Testeo de eventos.', () => {
            const myRef = new Reference();
            lgEvents.on(myDSM.type, lgTopics.SOURCE_REFERENCE_ADDED_REORDERED, (type, topic, data) => {
                expect(data.reference).toBe(myRef);
                expect(data.i).toBe(0);
                expect(data.target).toBe(myDSM);
            });
            myDSM.put(myRef);

            lgEvents.on(myDSM.type, lgTopics.SOURCE_REFERENCE_ADDED, (type, topic, data) => {
                expect(data.reference).toBe(myRef2);
                expect(data.i).toBe(0);
                expect(data.target).toBe(myDSM);
            });

            const myRef2 = new Reference();
            myDSM.put(myRef2);

        });

        it('En misma referencia pone como primera a la de indice menor.', () => {
            let myRefs = getRefs([{key: 'a9', indexes: [20, 25, 10]}]);

            let i = myDSM.put(myRefs[0]); // index:20
            expect(i).toBe(0);
            i = myDSM.put(myRefs[1]); // index:25
            expect(i).toBe(0);
            expect(myDSM.sourceByI(i).first).toBe(myRefs[0]); // first: index:20
            i = myDSM.put(myRefs[2]); // index:10
            expect(i).toBe(0);
            expect(myDSM.sourceByI(i).first).toBe(myRefs[2]); // first:index: 10
        });

        it('Asignación y orden de misma fuente, stress test', () => {
            let myRefs = getRefs([{
                key: 'a2',
                indexes: [50, 555, 23, 28, 56, 93, 32, 15, 25, 99, 4, 484, 5518, 88, 61, 129, 22, 12, 13, 14, 8]
            }]);
            let i_min = myRefs.indexOf(minBy(myRefs, 'index'));

            let i = null;
            myRefs.forEach(ref => {
                i = myDSM.put(ref);
                expect(i).toBe(0);  // todas son del mismo tipo por lo que todas deberían
                                    // ser 0.
            });
            expect(myDSM.sourceByI(i).first).toBe(myRefs[i_min]);
        });

        it('Orden de Referencias de distintas fuentes', () => {
            let myRefs = getRefs([
                {key: 'a5', indexes: [33, 24]},
                {key: 'a4', indexes: [40, 10, 33]}
            ]);

            myRefs.forEach(ref => myDSM.put(ref));
            expect(myDSM.sourceByI(0).key).toBe(myRefs[2].key); // a4
            // console.log(myDSM.sourceByI(0).key);
            expect(myDSM.sourceByI(0).first).toBe(myRefs[3]); // index:10
            // console.log(myDSM.sourceByI(0).first.index);
            expect(myDSM.sourceByI(1).key).toBe(myRefs[0].key); // a5
            // console.log(myDSM.sourceByI(1).key);
            expect(myDSM.sourceByI(1).first).toBe(myRefs[1]); // a5, index:24
            // console.log(myDSM.sourceByI(1).first.index);
        });

        it('orden distitnas fuentes, stress', () => {
            let data = [
                {key: 'b9', indexes: [441, 44, 12, 58, 123, 12, 93, 45]},
                {key: 'j4', indexes: [448, 92, 68, 33, 41, 87, 85, 25]},
                {key: 'b44', indexes: [51, 61, 22, 11, 112, 45, 52, 98]},
                {key: 'c12', indexes: [553, 37, 26, 526, 522, 89, 37, 62]},
            ];
            let myRefs = getRefs(data);

            const i_minRef = myRefs.indexOf(minBy(myRefs, 'index'));
            // console.log(`min: { key: ${myRefs[i_minRef].key}, index: ${myRefs[i_minRef].index}}`);
            //{ key: 'b44', index: 11 }

            myRefs.forEach(ref => myDSM.put(ref));

            expect(myDSM.sourceByI(0).key).toBe(myRefs[i_minRef].key);
            expect(myDSM.sourceByI(0).first).toBe(myRefs[i_minRef]);
        });

        it('Mock Referencia con id adecuado', () => {
            const key = 'a3';
            const myRef = new Reference({key: key});
            const myRef2 = new Reference({key: key});
            expect(myRef.id).toBe(0);
            expect(myRef2.id).toBe(1);
        });

        it('Obtener referencia por id', () => {
            let key = 'a2';
            const myRef = new Reference({key: key});
            myDSM.put(myRef);

            expect(myDSM.reference(myRef.key, myRef.id)).toBe(myRef);
            expect(mensajes.guardar).not.toBeCalledWith(
                SourceTypes.CITATION_DOCUMENT,
                lgTopics.ERROR,
                expect.objectContaining({
                    error: expect.any(Error)
                }));
            expect(myDSM.reference(myRef.key, 5)).toBe(false);
            expect(mensajes.guardar).not.toBeCalledWith(
                SourceTypes.CITATION_DOCUMENT,
                lgTopics.ERROR,
                expect.objectContaining({
                    error: expect.any(Error)
                }));
            expect(myDSM.reference('s3', 3)).toBe(false);
            expect(mensajes.guardar).toBeCalledWith(
                SourceTypes.CITATION_DOCUMENT,
                lgTopics.ERROR,
                expect.objectContaining({
                    error: expect.any(Error)
                }));
        });

        it('Remover referencia. clave inexistente tira error', () => {
            let key = 'a2';
            const myRef = new Reference({key: key});
            myDSM.put(myRef);
            expect(
                myDSM.removeReference(myRef.id, 'a3')
            ).toBe(-1);
            expect(mensajes.guardar).toBeCalledWith(
                SourceTypes.CITATION_DOCUMENT,
                lgTopics.ERROR,
                expect.objectContaining({
                    error: expect.any(Error)
                })
            );

        });

        it('Remover referencia. id inexistente tira error', () => {
            let key = 'a2';
            const myRef = new Reference({key: key});
            myDSM.put(myRef);
            expect(
                myDSM.removeReference(1, myRef.key)
            ).toBe(-1);
            expect(mensajes.guardar).toBeCalledWith(
                SourceTypes.CITATION_DOCUMENT,
                lgTopics.ERROR,
                expect.objectContaining({
                    error: expect.any(Error)
                })
            );
        });

        it('Remover referencia. Solo con el id', () => {
            let key = 'a2';
            const myRef = new Reference({key: key});
            myDSM.put(myRef);
            let sBlot_id = myRef.id; // puede ocurrir que solo se tenga el blot, y al ID desde allí
            myDSM.removeReference(sBlot_id); //
            expect(myDSM.length).toBe(0);
        });

        it('Remover referencia. Testeo de eventos', () => {
            let key = 'a2';
            const myRef = new Reference({key: key});
            myDSM.put(myRef);
            let sBlot_id = myRef.id; // puede ocurrir que solo se tenga el blot, y al ID desde allí
            lgEvents.on(myDSM.type, lgTopics.SOURCE_REFERENCE_REMOVED, (type, topic, data) => {
                expect(data.reference).toBe(myRef);
                expect(data.i).toBe(0);
                expect(data.first).toBe(true);
                expect(data.target).toBe(myDSM);
            });
            myDSM.removeReference(sBlot_id); //
            expect(myDSM.length).toBe(0);
        });

        it('Remover referencia. secundaria', () => {
            let myRefs = getRefs([
                {key: 'a2', indexes: [10, 11]}
            ]);

            myRefs.forEach(ref => {
                myDSM.put(ref);
            });

            expect(myDSM.removeReference(myRefs[1].id, myRefs[1].key)).toEqual(expect.any(Number));
            expect(myDSM.source(myRefs[0].key).length).toBe(1);

        });

        it('Remover referencia. primera, con fuentes restantes', () => {
            let myRefs = getRefs([
                {key: 'a2', indexes: [10, 11]}
            ]);

            myRefs.forEach(ref => {
                myDSM.put(ref);
            });

            let result = myDSM.removeReference(myRefs[0].id, myRefs[0].key,);
            expect(result).not.toBe(true);
            expect(result).toEqual(expect.any(Number));
            expect(myDSM.source(myRefs[0].key).length).toBe(1);
        });

        it('Remover referencia. primera, sin fuentes restantes', () => {
            let myRefs = getRefs([
                {key: 'a2', indexes: [10]},
                {key: 'b2', indexes: [12, 13]}
            ]);

            myRefs.forEach(ref => {
                myDSM.put(ref);
            });

            let result = myDSM.removeReference(myRefs[0].id, myRefs[0].key);
            expect(result).toEqual(expect.any(Number));
            expect(myDSM.source(myRefs[0].key)).toBeUndefined();
        });

        it('Manejo de orden de fuentes-referencias: test 1', () => {
            let inputData = [
                {
                    key: 'a2',
                    indexes: [
                        5, // id: 0
                        12, // 1
                        15 // 2
                    ]
                }, {
                    key: 'a3',
                    indexes: [
                        3, // 3
                        19, // 4
                        25 // 5
                    ]
                }, {
                    key: 'b3',
                    indexes: [
                        6, // 6
                        90 // 7
                    ]
                }
            ];

            let myRefs = getRefs(inputData);

            myRefs.forEach(ref => myDSM.put(ref));

            expect(myDSM.sourceIndex(inputData[0].key)).toBe(1);
            expect(myDSM.sourceIndex(inputData[1].key)).toBe(0);
            expect(myDSM.sourceIndex(inputData[2].key)).toBe(2);
        });


        it('Manejo de orden de fuentes-referencias: test 2', () => {
            let inputData = [
                {
                    key: 'a2',
                    indexes: [
                        5, // id: 0
                        12, // 1
                        15 // 2
                    ]
                }, {
                    key: 'a3',
                    indexes: [
                        3, // 3
                        19, // 4
                        25 // 5
                    ]
                }, {
                    key: 'b3',
                    indexes: [
                        6, // 6
                        90 // 7
                    ]
                }
            ];


            let myRefs = getRefs(inputData);

            myRefs.forEach(ref => myDSM.put(ref));

            expect(myDSM.sourceIndex(inputData[0].key)).toBe(1);
            expect(myDSM.sourceIndex(inputData[1].key)).toBe(0);
            expect(myDSM.sourceIndex(inputData[2].key)).toBe(2)

            mensajes.clear();
            mensajes.guardar.mockClear();

            expect(mensajes.guardar).not.toBeCalled();


            let ops = [
                {method: 'removeReference', args: {id: 3, key: inputData[1].key}},
                {method: 'removeReference', args: {id: 0, key: inputData[0].key}},
            ];

            ops.forEach(op => myDSM[op.method](...Object.values(op.args)));

            expect(mensajes.guardar).toBeCalledWith(
                SourceTypes.CITATION_DOCUMENT,
                lgTopics.SOURCE_ORDER_CHANGE,
                expect.objectContaining({
                    i: expect.any(Number)
                })
            );

            // let expectedData = [
            //     { // order: 1
            //         key: 'a2',
            //         indexes: [
            //             12, // 1
            //             15 // 2
            //         ]
            //     }, { // 2
            //         key: 'a3',
            //         indexes: [
            //             19, // 4
            //             25 // 5
            //         ]
            //     }, { // 0
            //         key: 'b3',
            //         indexes: [
            //             6, // 6
            //             90 // 7
            //         ]
            //     }
            // ];

            expect(myDSM.sourceIndex(inputData[0].key)).toBe(1);
            expect(myDSM.sourceIndex(inputData[1].key)).toBe(2);
            expect(myDSM.sourceIndex(inputData[2].key)).toBe(0);

        });

        it('Manejo de orden de fuentes-referencias: test 3', () => {
            let inputData = [
                {
                    key: 'a2',
                    indexes: [
                        5, // id: 0
                        12, // 1
                        15 // 2
                    ]
                }, {
                    key: 'a3',
                    indexes: [
                        3, // 3
                        19, // 4
                        25 // 5
                    ]
                }, {
                    key: 'b3',
                    indexes: [
                        6, // 6
                        90 // 7
                    ]
                }
            ];

            let myRefs = getRefs(inputData);

            myRefs.forEach(ref => myDSM.put(ref));

            expect(myDSM.sourceIndex(inputData[0].key)).toBe(1);
            expect(myDSM.sourceIndex(inputData[1].key)).toBe(0);
            expect(myDSM.sourceIndex(inputData[2].key)).toBe(2);

            mensajes.clear();
            mensajes.guardar.mockClear();
            expect(mensajes.guardar).not.toBeCalled();

            let ops = [
                {method: 'removeReference', args: {id: 3, key: inputData[1].key}},
                {method: 'removeReference', args: {id: 0, key: inputData[0].key}},
                {
                    method: 'put', args: [
                        new Reference({key: inputData[1].key, index: 2})
                    ]
                }, // id: 8
                {
                    method: 'put', args: [
                        new Reference({key: 'j4', index: 7})
                    ]
                }, // id: 9
            ];

            ops.forEach(op => myDSM[op.method](...Object.values(op.args)));

            expect(mensajes.guardar).toBeCalledWith(
                SourceTypes.CITATION_DOCUMENT,
                lgTopics.SOURCE_ORDER_CHANGE,
                expect.objectContaining({
                    i: expect.any(Number)
                })
            );

            // let expectedData = [
            //     { // order: 3
            //         key: 'a2',
            //         indexes: [
            //             12, // 1
            //             15 // 2
            //         ]
            //     }, { // 0
            //         key: 'a3',
            //         indexes: [
            //             2 // 8
            //             19, // 4
            //             25 // 5
            //         ]
            //     }, { // 1
            //         key: 'b3',
            //         indexes: [
            //             6, // 6
            //             90 // 7
            //         ]
            //     } { // 2
            //         key: 'j4',
            //         indexes: [
            //             7, // 9
            //         ]
            //     }
            // ];

            expect(myDSM.sourceIndex('a3')).toBe(0);
            expect(myDSM.sourceIndex('b3')).toBe(1);
            expect(myDSM.sourceIndex('j4')).toBe(2);
            expect(myDSM.sourceIndex('a2')).toBe(3);

            myDSM.removeReference(9, 'j4');

            expect(myDSM.sourceIndex('a3')).toBe(0);
            expect(myDSM.sourceIndex('b3')).toBe(1);
            expect(myDSM.sourceIndex('a2')).toBe(2);
            expect(myDSM.length).toBe(3);

        });
    });


    it('sin _DSM  arroja error', () => {
        expect(() => new SourcesList()).toThrow();
    });

    it('devuelve el tipo de fuente', () => {
        const mySL = new SourcesList(myDSM);
        expect(mySL.type).toBe(myDSM.type);
    });

    it('Modificar la lista obtenida no altera la lista original', () => {
        const mySL = new SourcesList(myDSM);
        const myList = mySL.list;
        // modifie the list in SL.
        expect(mySL.list).toEqual(myList);
        myList.push('something');
        expect(mySL.list).not.toEqual(myList);
        // console.log(mySL.list + '\n' + myList);
    });

    it('La lista sombra es actualizada', () => {
        const myShadowData = {};
        const mySL = new SourcesList(myDSM, myShadowData);

        let myRefs = getRefs([
            {key: 'a5', indexes: [33, 24]},
            {key: 'a4', indexes: [40, 10, 33]}
        ]);

        myRefs.forEach(ref => myDSM.put(ref));

        // add elements to _DSM and modify de list.
        expect(mySL.list).toEqual(myShadowData.list);
        // expect(mySL.list).not.toBe(myShadowData.list);
        // expect(mockGet).toBeCalled();
        // expect(mockSet).toBeCalled();
        // console.log(mySL.list + "\n" + myShadowData.list);
    });

    it('almacena adecuadamente fuentes iniciales del _DSM', () => {
        let myRefs = getRefs([
            {key: 'a5', indexes: [33, 24]},
            {key: 'a4', indexes: [40, 10, 33]}
        ]);

        myRefs.forEach(ref => myDSM.put(ref));
        const mySL = new SourcesList(myDSM, data);
        expect(mySL.i(0)).toBe(myDSM.sourceByI(0).key);
        expect(mySL.i(1)).toBe(myDSM.sourceByI(1).key);
        expect(data.list).toEqual([
            myDSM.sourceByI(0).key,
            myDSM.sourceByI(1).key
        ]);
    });

    it('agrega adecuadamente nuevas fuentes _DSM', () => {
        let myRefs1 = getRefs([
            {key: 'a5', indexes: [33, 24]},
        ]);

        let myRefs2 = getRefs([
            {key: 'a4', indexes: [40, 10, 33]}
        ]);

        myRefs1.forEach(ref => myDSM.put(ref));
        const mySL = new SourcesList(myDSM, data);
        expect(mySL.i(0)).toBe(myDSM.sourceByI(0).key);
        expect(data.list).toEqual([
            myDSM.sourceByI(0).key,
        ]);

        myRefs2.forEach(ref => myDSM.put(ref));
        expect(mySL.i(0)).toBe(myDSM.sourceByI(0).key);
        expect(mySL.i(1)).toBe(myDSM.sourceByI(1).key);
        expect(data.list).toEqual([
            myDSM.sourceByI(0).key,
            myDSM.sourceByI(1).key
        ]);

    });

    it('actualiza adecuadamente ante deleciones-inserciones nuevas', () => {
        let inputData = [
            {
                key: 'a2',
                indexes: [
                    5, // id: 0
                    12, // 1
                    15 // 2
                ]
            }, {
                key: 'a3',
                indexes: [
                    3, // 3
                    19, // 4
                    25 // 5
                ]
            }, {
                key: 'b3',
                indexes: [
                    6, // 6
                    90 // 7
                ]
            }
        ];

        let myRefs = getRefs(inputData);

        myRefs.forEach(ref => myDSM.put(ref));
        const mySL = new SourcesList(myDSM, data);

        expect(myDSM.sourceIndex(inputData[0].key)).toBe(1);
        expect(myDSM.sourceIndex(inputData[1].key)).toBe(0);
        expect(myDSM.sourceIndex(inputData[2].key)).toBe(2);

        expect(mySL.i(0)).toBe(myDSM.sourceByI(0).key);
        expect(mySL.i(1)).toBe(myDSM.sourceByI(1).key);
        expect(mySL.i(2)).toBe(myDSM.sourceByI(2).key);
        expect(data.list).toEqual([
            myDSM.sourceByI(0).key,
            myDSM.sourceByI(1).key,
            myDSM.sourceByI(2).key
        ]);

        mensajes.clear();
        mensajes.guardar.mockClear();
        expect(mensajes.guardar).not.toBeCalled();

        let ops = [
            {method: 'removeReference', args: {id: 3, key: inputData[1].key}},
            {method: 'removeReference', args: {id: 0, key: inputData[0].key}},
            {
                method: 'put', args: [
                    new Reference({key: inputData[1].key, index: 2})
                ]
            }, // id: 8
            {
                method: 'put', args: [
                    new Reference({key: 'j4', index: 7})
                ]
            }, // id: 9
        ];

        ops.forEach(op => myDSM[op.method](...Object.values(op.args)));

        expect(mensajes.guardar).toBeCalledWith(
            SourceTypes.CITATION_DOCUMENT,
            lgTopics.SOURCE_ORDER_CHANGE,
            expect.objectContaining({
                i: expect.any(Number)
            })
        );

        // let expectedData = [
        //     { // order: 3
        //         key: 'a2',
        //         indexes: [
        //             12, // 1
        //             15 // 2
        //         ]
        //     }, { // 0
        //         key: 'a3',
        //         indexes: [
        //             2 // 8
        //             19, // 4
        //             25 // 5
        //         ]
        //     }, { // 1
        //         key: 'b3',
        //         indexes: [
        //             6, // 6
        //             90 // 7
        //         ]
        //     } { // 2
        //         key: 'j4',
        //         indexes: [
        //             7, // 9
        //         ]
        //     }
        // ];

        expect(myDSM.sourceIndex('a3')).toBe(0);
        expect(myDSM.sourceIndex('b3')).toBe(1);
        expect(myDSM.sourceIndex('j4')).toBe(2);
        expect(myDSM.sourceIndex('a2')).toBe(3);

        expect(mySL.i(0)).toBe(myDSM.sourceByI(0).key);
        expect(mySL.i(1)).toBe(myDSM.sourceByI(1).key);
        expect(mySL.i(2)).toBe(myDSM.sourceByI(2).key);
        expect(mySL.i(3)).toBe(myDSM.sourceByI(3).key);
        expect(data.list).toEqual([
            myDSM.sourceByI(0).key,
            myDSM.sourceByI(1).key,
            myDSM.sourceByI(2).key,
            myDSM.sourceByI(3).key
        ]);

        myDSM.removeReference(9, 'j4');

        expect(myDSM.sourceIndex('a3')).toBe(0);
        expect(myDSM.sourceIndex('b3')).toBe(1);
        expect(myDSM.sourceIndex('a2')).toBe(2);
        expect(myDSM.length).toBe(3);
        expect(mySL.length).toBe(3);
        expect(data.list.length).toBe(3);
    });
});





