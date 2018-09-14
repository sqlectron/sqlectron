/**
 * unified-dataloader-gui
 * Copyright (C) 2018 Armarti Industries
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import * as connTypes from '../actions/connections';
import * as dbTypes from '../actions/databases';
import * as types from '../actions/columns';


const INITIAL_STATE = {
  isFetching: {},
  didInvalidate: false,
  columnsByTable: {},
};


export default function (state = INITIAL_STATE, action) {
  switch (action.type) {
    case connTypes.CONNECTION_REQUEST: {
      return action.isServerConnection
        ? { ...INITIAL_STATE, didInvalidate: true }
        : state;
    }
    case types.FETCH_COLUMNS_REQUEST: {
      return {
        ...state,
        isFetching: {
          ...state.isFetching,
          [action.database]: {
            ...state.isFetching[action.database],
            [action.table]: true,
          },
        },
        didInvalidate: false,
        error: null,
      };
    }
    case types.FETCH_COLUMNS_SUCCESS: {
      return {
        ...state,
        isFetching: {
          ...state.isFetching,
          [action.database]: {
            ...state.isFetching[action.database],
            [action.table]: false,
          },
        },
        didInvalidate: false,
        columnsByTable: {
          ...state.columnsByTable,
          [action.database]: {
            ...state.columnsByTable[action.database],
            [action.table]: action.columns.map(column => ({
              name: column.columnName,
              dataType: column.dataType,
            })),
          },
        },
        error: null,
      };
    }
    case types.FETCH_COLUMNS_FAILURE: {
      return {
        ...state,
        isFetching: {
          ...state.isFetching,
          [action.database]: {
            ...state.isFetching[action.database],
            [action.table]: false,
          },
        },
        didInvalidate: true,
        error: action.error,
      };
    }
    case dbTypes.REFRESH_DATABASES: {
      return {
        ...state,
        didInvalidate: true,
      };
    }
    default : return state;
  }
}
