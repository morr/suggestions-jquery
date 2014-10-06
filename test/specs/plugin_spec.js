
describe('Common features', function () {
    'use strict';
    
    var serviceUrl = '/some/url';

    beforeEach(function(){
        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo('body');
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'NAME',
            // disable mobile view features
            mobileWidth: null
        }).suggestions();

        this.server = sinon.fakeServer.create();
    });
    
    afterEach(function () {
        this.instance.dispose();
        this.$input.remove();
        this.server.restore();
    });

    it('Should initialize suggestions options', function () {
        expect(this.instance.options.serviceUrl).toEqual(serviceUrl);
    });

    it('Should create all additional components', function(){
        var instance = this.instance;
        $.each(['$wrapper','$container','$constraints'], function(i,component){
            expect(instance[component].length).toEqual(1);
        });
        expect(instance.preloader.$el.length).toEqual(1);
    });

    it('Should get current value', function () {
        this.input.value = 'Jam';
        this.instance.onValueChange();

        this.server.respond(helpers.responseFor([{ value: 'Jamaica', data: 'B' }]));

        expect(this.instance.visible).toBe(true);
        expect(this.instance.currentValue).toEqual('Jam');
    });

    it('Verify onSelect callback', function () {
        var suggestions = [{ value: 'A', data: 'B' }],
            options = {
                onSelect: function(){}
            };
        spyOn(options, 'onSelect');
        
        this.instance.setOptions(options);
        this.input.value = 'A';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(suggestions));
        this.instance.select(0);

        expect(options.onSelect.calls.count()).toEqual(1);
        expect(options.onSelect).toHaveBeenCalledWith(helpers.appendUnrestrictedValue(suggestions[0]));
    });

    it('Should convert suggestions format', function () {
        this.input.value = 'A';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(['Alex','Ammy','Anny']));
        expect(this.instance.suggestions[0]).toEqual(helpers.appendUnrestrictedValue({value:'Alex', data:null}));
        expect(this.instance.suggestions[1]).toEqual(helpers.appendUnrestrictedValue({value:'Ammy', data:null}));
        expect(this.instance.suggestions[2]).toEqual(helpers.appendUnrestrictedValue({value:'Anny', data:null}));
    });

    it('Should use custom query parameter name', function () {
        this.instance.setOptions({
            paramName: 'custom'
        });

        this.input.value = 'Jam';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"custom":"Jam"');
    });

    it('Should include params option into request', function () {
        this.instance.setOptions({
            params: {
                a: 1
            }
        });

        this.input.value = 'Jam';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('{"a":1,');
    });

    it('Should include params option into request when it is a function', function () {
        this.instance.setOptions({
            params: function(){
                return {a:2};
            }
        });

        this.input.value = 'Jam';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('{"a":2,');
    });

    it('Should include `bounds` option into request, if it is a range', function () {
        this.instance.setOptions({
            bounds: 'city-street'
        });

        this.input.value = 'Jam';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"from_bound":{"value":"city"}');
        expect(this.server.requests[0].requestBody).toContain('"to_bound":{"value":"street"}');
    });

    it('Should include `bounds` option into request, if it is a single value', function () {
        this.instance.setOptions({
            bounds: 'city'
        });

        this.input.value = 'Jam';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"from_bound":{"value":"city"}');
        expect(this.server.requests[0].requestBody).toContain('"to_bound":{"value":"city"}');
    });

    it('Should include `bounds` option into request, if it is an open range', function () {
        this.instance.setOptions({
            bounds: 'street-'
        });

        this.input.value = 'Jam';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestBody).toContain('"from_bound":{"value":"street"}');
        expect(this.server.requests[0].requestBody).not.toContain('"to_bound":');
    });

    it('Should destroy suggestions instance', function () {
        var $div = $(document.createElement('div'));

        $div.append(this.input);
        
        expect(this.$input.data('suggestions')).toBeDefined();

        this.$input.suggestions('dispose');

        expect(this.$input.data('suggestions')).toBeUndefined();
        $.each(['.suggestions-suggestions','.suggestions-preloader','.suggestions-constraints'], function(i, selector){
            expect($div.find(selector).length).toEqual(0);
        });
    });

    it('Should set width to be greater than zero', function () {
        this.input.value = 'Jam';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor([{ value: 'Jamaica', data: 'B' }]));
        expect(this.instance.$container.width()).toBeGreaterThan(0);
    });

    it('Should call beforeRender and pass container jQuery object', function () {
        var options = {
            beforeRender: function () {}
        };
        spyOn(options, 'beforeRender');
        this.instance.setOptions(options);

        this.input.value = 'Jam';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor([{ value: 'Jamaica', data: 'B' }]));

        expect(options.beforeRender.calls.count()).toEqual(1);
        expect(options.beforeRender).toHaveBeenCalledWith(this.instance.$container);
    });

    it('Should prevent Ajax requests if previous query with matching root failed.', function () {

        this.instance.setOptions({ preventBadQueries: true });
        this.input.value = 'Jam';
        this.instance.onValueChange();

        expect(this.server.requests.length).toEqual(1);
        this.server.respond(helpers.responseFor([]));

        this.input.value = 'Jama';
        this.instance.onValueChange();
        
        expect(this.server.requests.length).toEqual(1);

        this.input.value = 'Jamai';
        this.instance.onValueChange();
        
        expect(this.server.requests.length).toEqual(1);
    });

    it('Should display default hint message above suggestions', function(){
        this.input.value = 'jam';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(['Jamaica']));

        var $hint = this.instance.$container.find('.suggestions-hint');
            
        expect($hint.length).toEqual(1);
        expect($hint.text()).toEqual($.Suggestions.defaultOptions.hint);
    });

    it('Should display custom hint message above suggestions', function(){
        var customHint = 'This is custon hint';
        this.instance.setOptions({
            hint: customHint
        });

        this.input.value = 'jam';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(['Jamaica']));

        var $hint = this.instance.$container.find('.suggestions-hint');
            
        expect($hint.length).toEqual(1);
        expect($hint.text()).toEqual(customHint);
    });

    it('Should not display any hint message above suggestions', function(){
        this.instance.setOptions({
            hint: false
        });

        this.input.value = 'jam';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(['Jamaica']));

        var $hint = this.instance.$container.find('.suggestions-hint');
            
        expect($hint.length).toEqual(0);
    });

    it('Should not display any hint message for narrow-screen (mobile) view', function(){
        this.instance.setOptions({
            hint: false,
            mobileWidth: 0
        });

        this.input.value = 'jam';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor(['Jamaica']));

        var $hint = this.instance.$container.find('.suggestions-hint');

        expect($hint.length).toEqual(0);
    });

    it('Should include version info in requests', function(){
        this.input.value = 'jam';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestHeaders['X-Version']).toMatch(/\d+\.\d+\.\d+/);
    });

    it('Should send custom HTTP headers', function(){
        this.instance.setOptions({
            headers: {'X-my-header': 'blabla'}
        });
        this.input.value = 'jam';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestHeaders['X-my-header']).toEqual('blabla');
    });

    it('Should overwrite custom HTTP headers with ones used by plugin', function(){
        this.instance.setOptions({
            headers: {'X-Version': 'blabla'}
        });
        this.input.value = 'jam';
        this.instance.onValueChange();

        expect(this.server.requests[0].requestHeaders['X-Version']).toEqual($.Suggestions.version);
    });

});