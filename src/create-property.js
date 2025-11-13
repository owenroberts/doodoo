import { ValueProperty } from './value-property.js';
import { ListProperty } from './list-property.js';
import { StackProperty } from './stack-property.js';
import { Bundle } from './Bundle.js';

/**
 * get the correct property type based on params
 * @param  {object} [params]
 * @param  {string} name 
 * @return {Property}]
 */
export function createProperty(params={}, name) {

	if (params.type === 'bundle') {
		return new Bundle(params, name);	
	}

	if (params.hasOwnProperty('value')) {
		if (params.hasOwnProperty('list')) throw new Error(`uh oh ${params}`);
		if (params.hasOwnProperty('stack')) throw new Error(`uh oh ${params}`);
		return new ValueProperty(params, name);
	}

	if (params.hasOwnProperty('list')) {
		return new ListProperty(params, name);
	}
	
	if (params.hasOwnProperty('stack')) {
		return new StackProperty(params, name);
	}
}