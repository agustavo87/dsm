export default {
    save: jest.fn(
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