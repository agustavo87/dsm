import {SourceTypes} from '../../DSM/SourceTypes';
import lgEvents, {lgTopics} from "../../utils/events";

const mockListener = jest.fn(function (type, topic, data) {
    // console.log('Escuché:', type, topic, data);
    // console.log('ademas, this:', this);
});

const myListener = {
    msjs: [],
    listen: jest.fn(function (type, topic, data) {
        this.msjs.push({
            type:type,
            topic:topic,
            data:data
        })
    }),
    clear: function () {
        this.msjs = [];
    }
};

it('Listens to events as expected.', () => {
   lgEvents.on(SourceTypes.CITATION_DOCUMENT, lgTopics.SOURCE_ORDER_CHANGE, mockListener);
   lgEvents.emit(SourceTypes.CITATION_DOCUMENT, lgTopics.SOURCE_ORDER_CHANGE, {saludo:'hola'});
   expect(mockListener).toBeCalledWith(
       SourceTypes.CITATION_DOCUMENT,
       lgTopics.SOURCE_ORDER_CHANGE,
       expect.objectContaining({saludo:expect.any(String)})
   )
});

it('When specified, the events are listened only once', () => {
    lgEvents.clear(SourceTypes.CITATION_DOCUMENT, lgTopics.SOURCE_ORDER_CHANGE);
    mockListener.mockClear();

    expect(mockListener).not.toBeCalled();

    lgEvents.once(SourceTypes.CITATION_DOCUMENT, lgTopics.SOURCE_ORDER_CHANGE, mockListener);

    lgEvents.emit(SourceTypes.CITATION_DOCUMENT, lgTopics.SOURCE_ORDER_CHANGE, {saludo:'hola'});
    lgEvents.emit(SourceTypes.CITATION_DOCUMENT, lgTopics.SOURCE_ORDER_CHANGE, {saludo:'hola'});

    expect(mockListener).toHaveBeenCalledTimes(1);
});

// it('Se pueden vincular referencias a \'this\' particulares', () => {
it('Is posible to bind \'this\' refernces', () => {
    lgEvents.clear(SourceTypes.CITATION_DOCUMENT, lgTopics.SOURCE_ORDER_CHANGE);

    lgEvents.on(SourceTypes.CITATION_DOCUMENT, lgTopics.SOURCE_ORDER_CHANGE, myListener.listen.bind(myListener));

    lgEvents.emit(SourceTypes.CITATION_DOCUMENT, lgTopics.SOURCE_ORDER_CHANGE, {saludo:'hola'});

    expect(myListener.listen).toBeCalledWith(
        SourceTypes.CITATION_DOCUMENT,
        lgTopics.SOURCE_ORDER_CHANGE,
        expect.objectContaining({saludo:expect.any(String)})
    );

    expect(myListener.msjs[0]).toEqual(expect.objectContaining({
        type:SourceTypes.CITATION_DOCUMENT,
        topic:lgTopics.SOURCE_ORDER_CHANGE,
        data:expect.objectContaining({saludo:expect.any(String)})
    }))
});

it('Is posible to listen general events.', () => {
    myListener.clear();
    myListener.listen.mockClear();
    lgEvents.reset();
    lgEvents.onAny(myListener.listen, myListener);

    lgEvents.emit(SourceTypes.CITATION_DOCUMENT, lgTopics.SOURCE_ORDER_CHANGE, {saludo:'hola'});
    lgEvents.emit('puuu', 'cualquiera', {saludo:'hola'});

    expect(myListener.listen).toBeCalledTimes(2);

    expect(myListener.msjs[0]).toEqual(expect.objectContaining({
        type:SourceTypes.CITATION_DOCUMENT,
        topic:lgTopics.SOURCE_ORDER_CHANGE,
        data:expect.objectContaining({saludo:expect.any(String)})
    }));
    expect(myListener.msjs[1]).toEqual(expect.objectContaining({
        type:'puuu',
        topic:'cualquiera',
        data:expect.objectContaining({saludo:expect.any(String)})
    }))
});
