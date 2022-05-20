import DocumentSourcesModel from '../../DSM/DocumentSourcesModel';
import {SourceTypes} from '../../DSM/SourceTypes';
import Reference, {StaticReference, getRefs} from '../mocks/Reference';
import minBy from 'lodash/minBy';
import messages from '../support/messages';
import lgEvents, {lgTopics} from '../../utils/events.js';

jest.mock('../../quill/blots/source');

test('Construing DocumentSourcesModel without options notify error without interrupting execution', () => {
    const mySM = new DocumentSourcesModel();
    expect(mySM.errored).toBe(true);
    expect(mySM.error).toBeInstanceOf(Error);
});

test('DocumentSourcesModel emits error event', () => {
    lgEvents.on('', lgTopics.ERROR, messages.save.bind(messages));
    const mySM = new DocumentSourcesModel();

    expect(messages.save).toBeCalled();
    expect(messages._msjs[0]).toMatchObject({
        type: '',
        topic: lgTopics.ERROR,
        data: {
            error: expect.any(Error)
        }
    })
});

describe('Reference', () => {
    /** @type {DocumentSourcesModel} */
    let myDSM;
    lgEvents.onAny(messages.save, messages);

    beforeEach(() => {
        myDSM = new DocumentSourcesModel(SourceTypes.CITATION_DOCUMENT);
        messages.clear();
        messages.save.mockClear();
        Reference.mockClear();
        StaticReference.lastId = -1;
    });

    afterEach(() => {
        lgEvents.clear(myDSM.type, lgTopics.SOURCE_ORDER_CHANGE);
        lgEvents.clear(myDSM.type, lgTopics.SOURCE_REFERENCE_REMOVED);
        lgEvents.clear(myDSM.type, lgTopics.SOURCE_REFERENCE_ADDED_REORDERED);
        lgEvents.clear(myDSM.type, lgTopics.SOURCE_REFERENCE_ADDED);
    });

    describe('Order and assignament', () => {

        it('Throws error if inserting other Reference type', () => {
            const myRef = new Reference({type: 'inexistent.type'});
            expect(myDSM.put(myRef)).toBeLessThan(0);
            expect(messages.save).toHaveBeenCalledWith(
                SourceTypes.CITATION_DOCUMENT,
                lgTopics.ERROR,
                expect.objectContaining({
                    error: expect.any(Error)
                })
            );
        });

        it('Initial assignament to Reference', () => {
            const myRef = new Reference();
            let i = myDSM.put(myRef);
            expect(i).toBe(0);
        });

        it('Call expected events on assignment.', () => {
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

        it('In the same reference puts first the one with less index.', () => {
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

        /** @todo change this Event don't seem to have sense. */
        it('calls order change only once when two references of same source added - and the addition is before the \'first\' reference', () => {
            let mockReorder = jest.fn()

            lgEvents.on(SourceTypes.CITATION_DOCUMENT, lgTopics.SOURCE_ORDER_CHANGE, mockReorder)
            let myRefs = getRefs([{key: 'a9', indexes: [25, 20]}])
            myDSM.put(myRefs[0])
            myDSM.put(myRefs[1])

            expect(mockReorder).toBeCalledTimes(1)
        })

        it('calls order change when an existing source is added first and changes the order', () => {
            let mockReorder = jest.fn()

            let myRefs1 = getRefs([{key: 'a5', indexes: [33, 24]}]);
            let myRefs2 = getRefs([{key: 'a4', indexes: [40, 10]}]);

            myRefs1.forEach(ref => myDSM.put(ref));

            lgEvents.on(SourceTypes.CITATION_DOCUMENT, lgTopics.SOURCE_ORDER_CHANGE, mockReorder)
            myRefs2.forEach(ref => myDSM.put(ref));
            expect(mockReorder).toBeCalledTimes(2)
        })

        it('Assignment and order of the same source, stress test', () => {
            let myRefs = getRefs([{
                key: 'a2',
                indexes: [50, 555, 23, 28, 56, 93, 32, 15, 25, 99, 4, 484, 5518, 88, 61, 129, 22, 12, 13, 14, 8]
            }]);
            let i_min = myRefs.indexOf(minBy(myRefs, 'index'));

            let i = null;
            myRefs.forEach(ref => {
                i = myDSM.put(ref);
                expect(i).toBe(0);  // All are of the same type so all should be 0.
            });
            expect(myDSM.sourceByI(i).first).toBe(myRefs[i_min]);
        });

        it('Order of References of different sources', () => {
            let myRefs = getRefs([
                {key: 'a5', indexes: [33, 24]},
                {key: 'a4', indexes: [40, 10, 33]}
            ]);

            myRefs.forEach(ref => myDSM.put(ref));
            expect(myDSM.sourceByI(0).key).toBe(myRefs[2].key); // a4

            expect(myDSM.sourceByI(0).first).toBe(myRefs[3]); // index:10

            expect(myDSM.sourceByI(1).key).toBe(myRefs[0].key); // a5

            expect(myDSM.sourceByI(1).first).toBe(myRefs[1]); // a5, index:24

        });

        it('Order of different sources, stress', () => {
            let data = [
                {key: 'b9', indexes: [441, 44, 12, 58, 123, 12, 93, 45]},
                {key: 'j4', indexes: [448, 92, 68, 33, 41, 87, 85, 25]},
                {key: 'b44', indexes: [51, 61, 22, 11, 112, 45, 52, 98]},
                {key: 'c12', indexes: [553, 37, 26, 526, 522, 89, 37, 62]},
            ];
            let myRefs = getRefs(data);

            const i_minRef = myRefs.indexOf(minBy(myRefs, 'index'));

            myRefs.forEach(ref => myDSM.put(ref));

            expect(myDSM.sourceByI(0).key).toBe(myRefs[i_minRef].key);
            expect(myDSM.sourceByI(0).first).toBe(myRefs[i_minRef]);
        });

        it('Reference mocks have working id property', () => {
            const key = 'a3';
            const myRef = new Reference({key: key});
            const myRef2 = new Reference({key: key});
            expect(myRef.id).toBe(0);
            expect(myRef2.id).toBe(1);
        });

        it('Get References by its id', () => {
            let key = 'a2';
            const myRef = new Reference({key: key});
            myDSM.put(myRef);

            expect(myDSM.reference(myRef.key, myRef.id)).toBe(myRef);
            expect(messages.save).not.toBeCalledWith(
                SourceTypes.CITATION_DOCUMENT,
                lgTopics.ERROR,
                expect.objectContaining({
                    error: expect.any(Error)
                }));
            expect(myDSM.reference(myRef.key, 5)).toBe(false);
            expect(messages.save).not.toBeCalledWith(
                SourceTypes.CITATION_DOCUMENT,
                lgTopics.ERROR,
                expect.objectContaining({
                    error: expect.any(Error)
                }));
            expect(myDSM.reference('s3', 3)).toBe(false);
            expect(messages.save).toBeCalledWith(
                SourceTypes.CITATION_DOCUMENT,
                lgTopics.ERROR,
                expect.objectContaining({
                    error: expect.any(Error)
                }));
        });

        it('Remove Reference. Inexistent key throws error.', () => {
            let key = 'a2';
            const myRef = new Reference({key: key});
            myDSM.put(myRef);
            expect(
                myDSM.removeReference(myRef.id, 'a3')
            ).toBe(-1);
            expect(messages.save).toBeCalledWith(
                SourceTypes.CITATION_DOCUMENT,
                lgTopics.ERROR,
                expect.objectContaining({
                    error: expect.any(Error)
                })
            );
        });

        it('Remove Reference. Inexistent id throws error.', () => {
            let key = 'a2';
            const myRef = new Reference({key: key});
            myDSM.put(myRef);
            expect(
                myDSM.removeReference(1, myRef.key)
            ).toBe(-1);
            expect(messages.save).toBeCalledWith(
                SourceTypes.CITATION_DOCUMENT,
                lgTopics.ERROR,
                expect.objectContaining({
                    error: expect.any(Error)
                })
            );
        });

        it('Remove Reference. Only with id', () => {
            let key = 'a2';
            const myRef = new Reference({key});
            myDSM.put(myRef);
            let sBlot_id = myRef.id; // puede ocurrir que solo se tenga el blot, y al ID desde allí
            myDSM.removeReference(sBlot_id); 
            expect(myDSM.length).toBe(0);
        });

        it('Remove Refernce. Testing events', () => {
            let key = 'a2';
            const myRef = new Reference({key});
            myDSM.put(myRef);
            
            lgEvents.on(myDSM.type, lgTopics.SOURCE_REFERENCE_REMOVED, (type, topic, data) => {
                expect(data.reference).toBe(myRef);
                expect(data.i).toBe(0);
                expect(data.first).toBe(true);
                expect(data.target).toBe(myDSM);
            });
            myDSM.removeReference(myRef.id); 
            expect(myDSM.length).toBe(0);
        });

        it('Remove Refernce. Secondary.', () => {
            let myRefs = getRefs([
                {key: 'a2', indexes: [10, 11]}
            ]);

            myRefs.forEach(ref => {
                myDSM.put(ref);
            });

            expect(myDSM.removeReference(myRefs[1].id, myRefs[1].key)).toEqual(expect.any(Number));
            expect(myDSM.source(myRefs[0].key).length).toBe(1);
        });

        it('Remove Reference. First, with remaining references', () => {
            let myRefs = getRefs([
                {key: 'a2', indexes: [10, 11]}
            ]);

            myRefs.forEach(ref => {
                myDSM.put(ref);
            });

            let result = myDSM.removeReference(myRefs[0].id, myRefs[0].key,);

            expect(result).toEqual(expect.any(Number));
            expect(myDSM.source(myRefs[0].key).length).toBe(1);
            expect(myDSM.source('a2').first).toBe(myRefs[1])
        });

        it('Remove Reference. First, without remaining source', () => {
            let myRefs = getRefs([
                {key: 'a2', indexes: [10]},
                {key: 'b2', indexes: [12, 13]}
            ]);

            myRefs.forEach(ref => {
                myDSM.put(ref);
            });

            let result = myDSM.removeReference(myRefs[0].id);
            expect(result).toEqual(expect.any(Number));
            expect(myDSM.source('a2')).toBeUndefined();
            expect(myDSM.sourceByI(0).key).toBe('b2')
        });

        it('Management of Sources-References: test 1', () => {
            let ReferncesScenario = [
                {
                    key: 'a2',
                    indexes: [  // Reference ID
                        5,      // 0
                        12,     // 1
                        15      // 2
                    ]
                }, {
                    key: 'a3',
                    indexes: [
                        3,      // 3
                        19,     // 4
                        25      // 5
                    ]
                }, {
                    key: 'b3',
                    indexes: [
                        6,      // 6
                        90      // 7
                    ]
                }
            ];

            let myRefs = getRefs(ReferncesScenario);

            myRefs.forEach(ref => myDSM.put(ref));

            expect(myDSM.sourceIndex('a2')).toBe(1);
            expect(myDSM.sourceIndex('a3')).toBe(0);
            expect(myDSM.sourceIndex('b3')).toBe(2);
        });

        it('Management of order of Sources-References: test 2', () => {
            let ReferencesScenario = [
                {
                    key: 'a2',
                    indexes: [  // Reference ID
                        5,      // 0
                        12,     // 1
                        15      // 2
                    ]
                }, {
                    key: 'a3',
                    indexes: [
                        3,      // 3
                        19,     // 4
                        25      // 5
                    ]
                }, {
                    key: 'b3',
                    indexes: [
                        6,      // 6
                        90      // 7
                    ]
                }
            ];


            let myRefs = getRefs(ReferencesScenario);

            myRefs.forEach(ref => myDSM.put(ref));

            expect(myDSM.sourceIndex('a2')).toBe(1);
            expect(myDSM.sourceIndex('a3')).toBe(0);
            expect(myDSM.sourceIndex('b3')).toBe(2)

            messages.clear();
            messages.save.mockClear();

            expect(messages.save).not.toBeCalled();


            [
                {method: 'removeReference', args: [3, 'a3']},
                {method: 'removeReference', args: [0, 'a2']},
            ].forEach(op => myDSM[op.method](...op.args));

            expect(messages.save).toBeCalledWith(
                SourceTypes.CITATION_DOCUMENT,
                lgTopics.SOURCE_ORDER_CHANGE,
                expect.objectContaining({
                    i: expect.any(Number)
                })
            );

            expect(myDSM.sourceIndex('a2')).toBe(1);
            expect(myDSM.sourceIndex('a3')).toBe(2);
            expect(myDSM.sourceIndex('b3')).toBe(0);
        });

        it('Management of Sources-References: test 3', () => {
            let ReferencesScenario = [
                {
                    key: 'a2',
                    indexes: [  // Reference ID
                        5,      // 0
                        12,     // 1
                        15      // 2
                    ]
                }, {
                    key: 'a3',
                    indexes: [
                        3,      // 3
                        19,     // 4
                        25      // 5
                    ]
                }, {
                    key: 'b3',
                    indexes: [
                        6,      // 6
                        90      // 7
                    ]
                }
            ];

            let myRefs = getRefs(ReferencesScenario);

            myRefs.forEach(ref => myDSM.put(ref));

            expect(myDSM.sourceIndex('a2')).toBe(1);
            expect(myDSM.sourceIndex('a3')).toBe(0);
            expect(myDSM.sourceIndex('b3')).toBe(2);

            messages.clear();
            messages.save.mockClear();
            expect(messages.save).not.toBeCalled();

            [
                {method: 'removeReference', args: [3, 'a3']},
                {method: 'removeReference', args: [0, 'a2']},
                {method: 'put', args: [new Reference({key: 'a3', index: 2})]}, // id: 8
                {method: 'put', args: [new Reference({key: 'j4', index: 7})]}, // id: 9
            ].forEach(op => myDSM[op.method](...op.args));

            expect(messages.save).toBeCalledWith(
                SourceTypes.CITATION_DOCUMENT,
                lgTopics.SOURCE_ORDER_CHANGE,
                expect.objectContaining({
                    i: expect.any(Number)
                })
            );

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
});
