import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import Checkbox from '../../../src/renderer/components/checkbox';

const emptyFunc = () => {
  /* pass */
};

describe('<Checkbox />', () => {
  it('should have input with name and label elements', () => {
    const wrapper = shallow(
      <Checkbox
        name="test-name"
        label="test-label"
        checked={true}
        onChecked={emptyFunc}
        onUnchecked={emptyFunc}
      />,
    );
    expect(wrapper.find('input')).to.have.length(1);
    expect(wrapper.find('input').props().name).to.eql('test-name');
    expect(wrapper.find('label')).to.have.length(1);
    expect(wrapper.find('label').props().children).to.include('test-label');
  });

  it('should be checked', () => {
    const wrapper = shallow(
      <Checkbox
        name="test"
        label="test"
        checked={true}
        onChecked={emptyFunc}
        onUnchecked={emptyFunc}
      />,
    );
    expect(wrapper.find('input')).to.have.length(1);
    const input = wrapper.find('input');
    expect(input.props().checked).to.be.true;
  });

  it('should be unchecked', () => {
    const wrapper = shallow(
      <Checkbox
        name="test"
        label="test"
        checked={false}
        onChecked={emptyFunc}
        onUnchecked={emptyFunc}
      />,
    );
    const input = wrapper.find('input');
    expect(input.props().checked).to.be.false;
  });

  it('should trigger onChecked for checked event', () => {
    let checked = false;
    let unchecked = false;
    const wrapper = shallow(
      <Checkbox
        name="test"
        label="test"
        checked={false}
        onChecked={() => {
          checked = true;
        }}
        onUnchecked={() => {
          unchecked = true;
        }}
      />,
    );
    const input = wrapper.find('input');
    expect(input.props().checked).to.be.false;
    input.simulate('change', { target: { checked: true } });
    expect(checked).to.be.true;
    expect(unchecked).to.be.false;
  });

  it('should trigger onUnchecked for unchecked event', () => {
    let checked = false;
    let unchecked = false;
    const wrapper = shallow(
      <Checkbox
        name="test"
        label="test"
        checked={false}
        onChecked={() => {
          checked = true;
        }}
        onUnchecked={() => {
          unchecked = true;
        }}
      />,
    );
    const input = wrapper.find('input');
    expect(input.props().checked).to.be.false;
    input.simulate('change', { target: { checked: false } });
    expect(checked).to.be.false;
    expect(unchecked).to.be.true;
  });
});
