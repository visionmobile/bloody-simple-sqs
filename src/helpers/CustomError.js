import _ from 'lodash';
import type from 'type-of';

class CustomError extends Error {

  constructor (err, name = 'Error') {
    super();

    if (_.isString(err)) {
      this.message = err;
    } else if (err instanceof Error) {
      this.message = err.message;
      this.stack = err.stack;
    } else {
      throw new Error(`Invalid err argument; expected string or Error, received ${type(err)}`);
    }

    this.name = name;
    this.time = new Date();
  }

}

export default CustomError;
