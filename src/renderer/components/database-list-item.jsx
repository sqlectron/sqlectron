import React, { Component, PropTypes } from 'react';
import DatabaseListItemMetatada from './database-list-item-metadata.jsx';
import DatabaseFilter from './database-filter.jsx';


const STYLE = {
  database: {
    fontSize: '0.85em',
    color: '#636363',
    wordBreak: 'break-all',
    cursor: 'default',
    // force menu item go over the parent padding
    // this way allows the whole line be clickable
    position: 'abosolute',
    margin: '-0.92857143em -1.14285714em',
    padding: '0.92857143em 1.14285714em',
    display: 'block',
  },
};


export default class DatabaseListItem extends Component {
  static propTypes = {
    tables: PropTypes.array,
    columnsByTable: PropTypes.object,
    triggersByTable: PropTypes.object,
    views: PropTypes.array,
    functions: PropTypes.array,
    procedures: PropTypes.array,
    database: PropTypes.object.isRequired,
    focusSearch: PropTypes.bool,
    onExecuteDefaultQuery: PropTypes.func.isRequired,
    onSelectTable: PropTypes.func.isRequired,
    onSelectDatabase: PropTypes.func.isRequired,
    onGetSQLScript: PropTypes.func.isRequired,
  }

  constructor(props, context) {
    super(props, context);
    this.state = {};
  }

  componentWillReceiveProps(nextProps) {
    // If search is toggled for certain database that is collapsed then toggle collapse.
    if (this.state.collapsed &&
      this.props.focusSearch !== nextProps.focusSearch){

      this.toggleCollapse();
    }
  }

  onFilterChange(value) {
    this.setState({ filter: value });
  }

  onHeaderDoubleClick(database) {
    if (!this.isMetadataLoaded()) {
      this.props.onSelectDatabase(database);
      return;
    }

    this.toggleCollapse();
  }

  filterItems(filterInput, items) {
    const regex = RegExp(filterInput, 'i');
    return items.filter(item => regex.test(item.name));
  }

  isMetadataLoaded() {
    const { tables, views, functions, procedures } = this.props;
    return tables && views && functions && procedures;
  }

  toggleCollapse() {
    this.setState({ collapsed: !this.state.collapsed });
  }

  renderHeader(database) {
    const collapseCssClass = !this.isMetadataLoaded() || this.state.collapsed ? 'right' : 'down';

    return (
      <span
        className="header"
        onDoubleClick={() => this.onHeaderDoubleClick(database)}
        style={STYLE.database}>
        <i className={`${collapseCssClass} triangle icon`}
          style={{cursor: 'pointer'}}
          onClick={() => this.onHeaderDoubleClick(database)}></i>
        <i className="database icon"></i>
        {database.name}
      </span>
    );
  }

  render() {
    const { filter } = this.state;
    const {
      tables,
      columnsByTable,
      triggersByTable,
      views,
      functions,
      procedures,
      database,
      focusSearch,
      onExecuteDefaultQuery,
      onSelectTable,
      onGetSQLScript,
    } = this.props;

    let filteredTables;
    let filteredViews;
    let filteredFunctions;
    let filteredProcedures;

    const cssStyleItems = {};
    const isMetadataLoaded = this.isMetadataLoaded();
    if (this.state.collapsed || !isMetadataLoaded) {
      cssStyleItems.display = 'none';
    } else {
      filteredTables = this.filterItems(filter, tables);
      filteredViews = this.filterItems(filter, views);
      filteredFunctions = this.filterItems(filter, functions);
      filteredProcedures = this.filterItems(filter, procedures);
    }

    return (
      <div className="item">
        {this.renderHeader(database)}
        <div className="ui list" style={cssStyleItems}>
          <div className="item" style={cssStyleItems}>
            <DatabaseFilter
              value={filter}
              focusSearch={focusSearch}
              isFetching={!isMetadataLoaded}
              onFilterChange={::this.onFilterChange} />
          </div>
          <DatabaseListItemMetatada
            title="Tables"
            items={filteredTables || tables}
            columnsByTable={columnsByTable}
            triggersByTable={triggersByTable}
            database={database}
            onExecuteDefaultQuery={onExecuteDefaultQuery}
            onSelectItem={onSelectTable}
            onGetSQLScript={onGetSQLScript} />
          <DatabaseListItemMetatada
            collapsed
            title="Views"
            items={filteredViews || views}
            database={database}
            onExecuteDefaultQuery={onExecuteDefaultQuery}
            onGetSQLScript={onGetSQLScript} />
          <DatabaseListItemMetatada
            collapsed
            title="Functions"
            items={filteredFunctions || functions}
            database={database}
            onGetSQLScript={onGetSQLScript} />
          <DatabaseListItemMetatada
            collapsed
            title="Procedures"
            items={filteredProcedures || procedures}
            database={database}
            onGetSQLScript={onGetSQLScript} />
        </div>
      </div>
    );
  }
}
