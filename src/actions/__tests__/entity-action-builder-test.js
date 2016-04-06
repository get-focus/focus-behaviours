import {actionBuilder} from '../entity-actions-builder';
describe('The actionBuilder', () => {
    describe('when called with wrong parameters', () => {
        it('should throw a type error when called without all parameters', () => {
            expect(() => { actionBuilder()}).to.throw(TypeError,'Cannot read property \'name\' of undefined');
        });
        it('should throw an error when called without a string name parameter', () => {
            const NAME_MESSAGE = 'ACTION_BUILDER: the name parameter should be a string.';
            expect(() => { actionBuilder({name: undefined})}).to.throw(NAME_MESSAGE);
            expect(() => { actionBuilder({name: 1})}).to.throw(NAME_MESSAGE);
            expect(() => { actionBuilder({name: {}})}).to.throw(NAME_MESSAGE);
            expect(() => { actionBuilder({name: () => {}})}).to.throw(NAME_MESSAGE);
            expect(() => { actionBuilder({name: ''})}).to.throw(NAME_MESSAGE);
            expect(() => { actionBuilder({name: 'test'})}).to.not.throw(NAME_MESSAGE);
        });
        it('should throw an error when called without a string type parameter : load,save,delete', () => {
            const TYPE_MESSAGE = 'ACTION_BUILDER: the type parameter should be a string and the value one of these: load,save,delete.';
            expect(() => { actionBuilder({name: 'test'})}).to.throw(TYPE_MESSAGE);
            expect(() => { actionBuilder({name: 'test', type: undefined})}).to.throw(TYPE_MESSAGE);
            expect(() => { actionBuilder({name: 'test', type: 1})}).to.throw(TYPE_MESSAGE);
            expect(() => { actionBuilder({name: 'test', type: {}})}).to.throw(TYPE_MESSAGE);
            expect(() => { actionBuilder({name: 'test', type: () => {}})}).to.throw(TYPE_MESSAGE);
            expect(() => { actionBuilder({name: 'test', type: ''})}).to.throw(TYPE_MESSAGE);
            expect(() => { actionBuilder({name: 'test', type: 'nimp'})}).to.throw(TYPE_MESSAGE);
            expect(() => { actionBuilder({name: 'test', type: 'load'})}).to.not.throw(TYPE_MESSAGE);
            expect(() => { actionBuilder({name: 'test', type: 'save'})}).to.not.throw(TYPE_MESSAGE);
            expect(() => { actionBuilder({name: 'test', type: 'delete'})}).to.not.throw(TYPE_MESSAGE);
        });
        it('should throw an error when called without a function returning a Promise service parameter', () => {
            const SERVICE_MESSAGE = 'ACTION_BUILDER: the service parameter should be a function.';
            expect(() => { actionBuilder({name: 'test', type: 'load'})}).to.throw(SERVICE_MESSAGE);
            expect(() => { actionBuilder({name: 'test', type: 'load', service: undefined})}).to.throw(SERVICE_MESSAGE);
            expect(() => { actionBuilder({name: 'test', type: 'load', service: 1})}).to.throw(SERVICE_MESSAGE);
            expect(() => { actionBuilder({name: 'test', type: 'load', service: 'nimp'})}).to.throw(SERVICE_MESSAGE);
            expect(() => { actionBuilder({name: 'test', type: 'load', service: {}})}).to.throw(SERVICE_MESSAGE);
            expect(() => { actionBuilder({name: 'test', type: 'load', service: null})}).to.throw(SERVICE_MESSAGE);
            expect(() => { actionBuilder({name: 'test', type: 'load', service: () => Promise.resolve({test: 'test'})})}).to.not.throw(SERVICE_MESSAGE);
        });
    })
    describe('when called with right parameters', () => {
        const RESOLVE_VALUE = {testValue: 'tests'};
        const REJECT_VALUE = {error: 'error'};
        const TEST_VALID_ACTION_BUILDER_PARAMS_RESOLVE = {name: 'test', type: 'load', service: () => Promise.resolve(RESOLVE_VALUE)};
        const TEST_VALID_ACTION_BUILDER_PARAMS_REJECT = {name: 'test', type: 'load', service: () => Promise.reject(REJECT_VALUE)};
        it('should return an object with types, creators, action', () => {
            const actionBuilded = actionBuilder(TEST_VALID_ACTION_BUILDER_PARAMS_RESOLVE);
            expect(actionBuilded).to.be.an('object');
            expect(actionBuilded).to.include.keys('types', 'creators', 'action');
        });
        describe('The types part of the result', () => {
            it('should return an object with three types with REQUEST, RESPONSE and ERROR', () => {
              const {types: actionBuildedTypes} = actionBuilder(TEST_VALID_ACTION_BUILDER_PARAMS_RESOLVE);
              expect(actionBuildedTypes).to.be.an('object');
              expect(actionBuildedTypes).to.include.keys('REQUEST_LOAD_TEST', 'RESPONSE_LOAD_TEST', 'ERROR_LOAD_TEST');
          });
        });
        describe('The creators part of the result', () => {
            const {creators: actionBuildedCreators} = actionBuilder(TEST_VALID_ACTION_BUILDER_PARAMS_RESOLVE);
            it('should return an object with three keys with request, response, error', () => {
              expect(actionBuildedCreators).to.be.an('object');
              expect(actionBuildedCreators).to.include.keys('requestLoadTest', 'responseLoadTest', 'errorLoadTest');
          });
            it('should return an object with three values with request, response, error', () => {
              const {requestLoadTest: requestActionCreator, responseLoadTest: responseActionCreator, errorLoadTest: errorActionCreator} = actionBuildedCreators;
              expect(requestActionCreator).to.be.a.function;
              expect(responseActionCreator).to.be.a.function;
              expect(errorActionCreator).to.be.a.function;
              const PAYLOAD = {test: 'test'};
              expect(requestActionCreator(PAYLOAD)).to.deep.equal({type: 'REQUEST_LOAD_TEST', payload: PAYLOAD, syncForm: true, entityPath: 'test'});
              expect(responseActionCreator(PAYLOAD)).to.deep.equal({type: 'RESPONSE_LOAD_TEST', payload: PAYLOAD, syncForm: true, entityPath: 'test'});
              expect(errorActionCreator(PAYLOAD)).to.deep.equal({type: 'ERROR_LOAD_TEST', payload: PAYLOAD, syncForm: true, entityPath: 'test'});
          });
        });
        describe('The action part of the result', () => {
            const {action: actionBuildedResolveAsync} = actionBuilder(TEST_VALID_ACTION_BUILDER_PARAMS_RESOLVE);
            const {action: actionBuildedRejectAsync} = actionBuilder(TEST_VALID_ACTION_BUILDER_PARAMS_REJECT);
            const CRITERIA = {id: 'test'};
            it('should return a function', () => {
              expect(actionBuildedResolveAsync).to.be.a.function;
              expect(actionBuildedRejectAsync).to.be.a.function;
          });
            it('when called with a successfull service should call the response and request action creators', async done => {
              const dispatchSpy = sinon.spy();
              await actionBuildedResolveAsync()(dispatchSpy);
              expect(dispatchSpy).to.have.been.called.twice;
              expect(dispatchSpy).to.have.callCount(2);
              expect(dispatchSpy).to.have.been.called.calledWith({type: 'REQUEST_LOAD_TEST', syncForm: true, entityPath: 'test'});
              expect(dispatchSpy).to.have.been.called.calledWith({type: 'RESPONSE_LOAD_TEST', payload: RESOLVE_VALUE, syncForm: true, entityPath: 'test'});
              done();
          });
            it('when called with an unsuccessfull service should call the error action creator', async done => {
              const dispatchSpy = sinon.spy();
              await actionBuildedRejectAsync()(dispatchSpy);
              expect(dispatchSpy).to.have.been.called.once;
              expect(dispatchSpy).to.have.been.called.calledWith({type: 'ERROR_LOAD_TEST', payload: REJECT_VALUE, syncForm: true, entityPath: 'test'});
              done();
          });
        });
    });
});
