import React, { Component, PropTypes } from 'react'
import { connect } from 'tunk-react'
import '../store/counter';
import '../store/counterText';
import ReactDOM from 'react-dom';

@connect
class Btn extends Component {

  static propType = {
    count: PropTypes.number.isRequired
  }

  componentWillMount(){
    this.dispatch('counter.decrement');
  }

  decrement(){
    this.dispatch('counter.decrement');
  }

  render() {
    console.log(this);
    return (
        <button onClick={this.decrement.bind(this)}>-</button>
    )
  }
}


@connect({
  count: 'counter.count',
  text:'counterText.text'
},{
  incrementIfOdd:'counter.incrementIfOdd',
  incrementAsync:'counter.incrementAsync',
})
export default class Counter extends Component {

	componentWillReceiveProps(props) {
		const el = ReactDOM.findDOMNode(this.refs.btn1);
		console.log('ReactDOM',{el});
	}

  increment__(){
    this.dispatch('counter.increment');
  }

  render() {

    const { count, text } = this.props;

    const { increment, incrementIfOdd, incrementAsync, decrement} = this;

    return (
      <p>
        Clicked: {count}  times
        {' '}
        <button ref='btn1' onClick={this.increment__.bind(this)}>+</button>
        {' '}
        <Btn/>
        {' '}
        <button onClick={incrementIfOdd}> incrementIfOdd </button>
        {' '}
        <button onClick={() => incrementAsync()}>Increment async</button>
        <br/><br/>{text}
      </p>

    )
  }
}
