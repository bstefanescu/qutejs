import { document } from '@qutejs/window';
import assert from 'assert';
import Qute from '..';

const TestMixin = Qute(function() {
    var h1 = document.createElement('h1');
    h1.textContent = 'Test Mixins';
    return h1;
});
TestMixin.channel(()=>{})
TestMixin.mixin({
    addMixin1Class() {
        this.$el.className = 'mixin1';
    }
},
{
    addMixin2Class() {
        this.$el.className = 'mixin2';
    },
    changeText() {
        this.$el.textContent = 'Test Mixins changed';
    }
});

describe('Component Mixins', () => {
    it('can add mixins to a component type', () => {
        let test = new TestMixin().mount();
        assert.ok(!test.$el.className);
        assert.strictEqual(test.$el.textContent, 'Test Mixins');
        test.addMixin1Class();
        assert.strictEqual(test.$el.className, 'mixin1');
        test.addMixin2Class();
        assert.strictEqual(test.$el.className, 'mixin2');
        test.changeText();
        assert.strictEqual(test.$el.textContent, 'Test Mixins changed');
    })
});
