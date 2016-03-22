import React from 'react';
import CSSTransitionGroup from 'react-addons-css-transition-group';
import ReactDOM from 'react-dom';
import { ReactRouter, Router, Route, Navigation, History } from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory';
import h from './helpers';
import reactMixin from 'react-mixin';
import Catalyst from 'react-catalyst';
//firebase
import Rebase from 're-base';
var base = Rebase.createClass('https://catch-ofthe-day.firebaseio.com/')

// app
class App extends React.Component {
	constructor() {
		super();
	    this.state = {
	      	fishes : {},
	      	order : {}
	    }
  	}

  	componentDidMount() {
  		base.syncState(this.props.params.storeId + '/fishes', {
  			context: this,
  			state: 'fishes'
  		});

  		var localStorageRef = localStorage.getItem('order-' + this.props.params.storeId);

  		if (localStorageRef) {
  			this.setState({
  				order: JSON.parse(localStorageRef)
  			})
  		}
  	}

  	componentWillUpdate(nextProps, nextState) {
  		localStorage.setItem('order-' + this.props.params.storeId, JSON.stringify(nextState.order));
  	}

  	addToOrder(key) {
  		this.state.order[key] = this.state.order[key] + 1 || 1;
  		this.setState({ 
  			order: this.state.order 
  		});
  	}

  	removeFromOrder(key) {
  		delete this.state.order[key];
  		this.setState({
  			order: this.state.order
  		})
  	}

	addFish(fish) {
	    var timestamp = (new Date()).getTime();
	    // update the state object
	    this.state.fishes['fish-' + timestamp] = fish;
	    // set the state
	    this.setState({ 
	    	fishes : this.state.fishes 
	    });
	}

	removeFish(key) {
		if (confirm('Are you sure you want to remove this fish??')) {
			this.state.fishes[key] = null;
			this.setState({
				fishes: this.state.fishes
			})
		}
	}

	loadSamples() {
		this.setState({
			fishes: require('./sample-fishes')
		});
	}

	renderFish(key) {
		return <Fish key={key} 
				index={key} 
				details={this.state.fishes[key]} 
				addToOrder={this.addToOrder.bind(this)}/>
	}

	render() {
		return (
			<div className="catch-of-the-day">
				<div className="menu">
					<Header tagline="Fresh Seafood Market"/>
					<ul className="list-of-fishes">
						{Object.keys(this.state.fishes).map(this.renderFish.bind(this))}
					</ul>
				</div>
				<Order fishes={this.state.fishes} 
					order={this.state.order} 
					removeFromOrder={this.removeFromOrder.bind(this)}/>
				<Inventory addFish={this.addFish.bind(this)} 
					loadSamples={this.loadSamples.bind(this)}
					fishes={this.state.fishes} 
					linkState={this.linkState.bind(this)}
					removeFish={this.removeFish.bind(this)} />
			</div>
		);
	}
} // end app

// fish
class Fish extends React.Component {
	onButtonClick() {
		this.props.addToOrder(this.props.index);
	}

	render() {
		var details = this.props.details;
		var isAvailable = (details.status === 'available' ? true : false );
		var buttonText = (isAvailable ? 'Add to order' : 'Sold Out!');

		return (
			<li className="menu-fish">
				<img src={details.image} alt={details.name} />
				<h3 className="fish-name">
					{details.name}
					<span className="price">{h.formatPrice(details.price)}</span>
				</h3>
				<p>{details.desc}</p>
				<button disabled={!isAvailable} onClick={this.onButtonClick.bind(this)}>{buttonText}</button>
			</li>
		)
	}
} // end fish

// add fish form
class AddFishForm extends React.Component {
  	createFish(event) {
	    // 1. Stop the form from submitting
	    event.preventDefault();
	    // 2. Take the data from the form and create an object
	    var fish = {
	      	name: this.refs.name.value,
	      	price: this.refs.price.value,
	      	status: this.refs.status.value,
	      	desc: this.refs.desc.value,
	      	image: this.refs.image.value
	    }
	    console.log(fish);
	    // 3. Add the fish to the App State
	    this.props.addFish(fish);
	    this.refs.fishForm.reset();
  	}

  render() {
    return (
      	<form className="fish-edit" ref="fishForm" onSubmit={this.createFish.bind(this)}>
        	<input type="text" ref="name" placeholder="Fish Name"/>
        	<input type="text" ref="price" placeholder="Fish Price" />
        	<select ref="status">
          		<option value="available">Fresh!</option>
          		<option value="unavailable">Sold Out!</option>
        	</select>
        	<textarea type="text" ref="desc" placeholder="Desc"></textarea>
        	<input type="text" ref="image" placeholder="URL to Image" />
        	<button type="submit">+ Add Item </button>
      </form>
    )
  }
} // end fish form

// header
class Header extends React.Component {
	render() {
		return (
			<header className="top">
				<h1>Catch
					<span className="ofThe"> 
						<span className="of">of</span> 
						<span className="the">the</span> 
					</span>
					Day</h1>
				<h3 className="tagline"><span>{this.props.tagline}</span></h3>
			</header>
		)
	}
} // end header
Header.propTypes = {
	tagline: React.PropTypes.string.isRequired
}

// order
class Order extends React.Component {
	renderOrder(key) {
		var fish = this.props.fishes[key];
		var count = this.props.order[key];
		var removeButton = <button onClick={this.props.removeFromOrder.bind(null, key)}> &times; </button>

		if (!fish) {
			return <li key={key}>Sorry, fish no longer available! {removeButton}</li>
		} 

		return (
			<li key={key}>
				<span>
					<CSSTransitionGroup component="span" 
							transitionName="count"
							transitionEnterTimeout={250}
							transitionLeaveTimeout={250}>
						<span key={count}>{count}</span>
					</CSSTransitionGroup>
					lbs &nbsp; {fish.name} &nbsp; {removeButton} 
				</span> 

				<span className="price">{h.formatPrice(count * fish.price)}</span>
			</li>
		)
	}

	render() {
		var orderIds = Object.keys(this.props.order);
		var total = orderIds.reduce((prevTotal, key) => {
			var fish = this.props.fishes[key];
			var count = this.props.order[key];
			var isAvailable = fish && fish.status === 'available';

			if (fish && isAvailable) {
				return prevTotal + (count * parseInt(fish.price)) || 0;
			}

			return prevTotal;
		}, 0);
		return (
			<div className="order-wrap">
				<h2 className="order-title">Your Order</h2>
				<CSSTransitionGroup 
						className="order" 
						component="ul"
						transitionName="order"
						transitionEnterTimeout={500}
						transitionLeaveTimeout={500}>
					{orderIds.map(this.renderOrder.bind(this))}
					<li className="total">
						<strong>Total:</strong>
						{h.formatPrice(total)}
					</li>
				</CSSTransitionGroup>
			</div>
		)
	}
} // end order
Order.propTypes = {
	order: React.PropTypes.object.isRequired,
	fishes: React.PropTypes.object.isRequired,
	removeFromOrder: React.PropTypes.func.isRequired
}

// inventory
class Inventory extends React.Component {
	renderInventory(key) {
		var linkState = this.props.linkState;
		var fishes = this.props.fishes;
		return (
			<div className="fish-edit" key={key}>
				<input type="text" valueLink={linkState('fishes.' + key + '.name')} />
				<input type="text" valueLink={linkState('fishes.' + key + '.price')} />
				<select valueLink={linkState('fishes.' + key + '.status')}>
					<option value="available">Fresh!</option>
					<option value="unavailable">Sold Out!</option>
				</select>
				<textarea type="text" valueLink={linkState('fishes.' + key + '.desc')}></textarea>
				<input type="text" valueLink={linkState('fishes.' + key + '.image')} />
				<button onClick={this.props.removeFish.bind(null, key)}>Remove Fish</button>
			</div>
		)
	}

	render() {
		return (
			<div>
				<h2>Inventory</h2>
				{Object.keys(this.props.fishes).map(this.renderInventory.bind(this))}
				<AddFishForm {...this.props}/>
				<button onClick={this.props.loadSamples}>Load Samples</button>
			</div>
		)
	}
} // end inventory
Inventory.propTypes = {
	fishes: React.PropTypes.object.isRequired,
	loadSamples: React.PropTypes.func.isRequired,
	addFish: React.PropTypes.func.isRequired,
	linkState: React.PropTypes.func.isRequired,
	removeFish: React.PropTypes.func.isRequired
}

// storepicker 
class StorePicker extends React.Component {
	goToStore(event) {
		event.preventDefault();
		//get the data from input
		var storeId = this.refs.storeId.value;
		//transition from StorePicker to App
		this.history.pushState(null, '/store/' + storeId);
	}

	render() {
		return (
			<form className="store-selector" onSubmit={this.goToStore.bind(this)}>
				<h2>Please Enter A Store</h2>
				<input type="text" ref="storeId" defaultValue={h.getFunName()} required />
				<input type="Submit" />
			</form>
		)
	}
} // end store picker

// not found
class NotFound extends React.Component {
	render() {
		return (
			<h1>404 Not Found</h1>
		)
	}
}

// mixins
reactMixin.onClass(StorePicker, History);
reactMixin.onClass(App, Catalyst.LinkedStateMixin);

// routes
var routes = (
	<Router history={createBrowserHistory()}>
		<Route path="/" component={StorePicker} />
		<Route path="/store/:storeId" component={App} />
		<Route path="*" component={NotFound} />
	</Router>
);
var loadPoint = document.getElementById('main');
ReactDOM.render(routes, loadPoint);