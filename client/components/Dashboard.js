import React, { Component } from 'react';
import '../styles/Dashboard.css';
import schemaGenerator from '../../utils/modelCodeMaker2';
import LogoutButton from './LogoutButton';
import SchemaStorage from './SchemaStorage.jsx';
import SchemaName from './SchemaName';
import SchemaHeaders from './SchemaHeaders';
import Rows from './Rows';
import OptionButtons from './OptionButtons';
import SaveButton from './SaveButton';
import Select from 'react-select';
import DeleteButton from './DeleteButton'


const autoBind = require('auto-bind');

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      result: '',
      schema: {
        schemaName: '',
        rows: [
          {
            key: '',
            type: '',
            options: {
              required: false,
              unique: false
            }
          }
        ]
      },
      userSchemaArr: [],
      deleteThisSchema: null,
    };

    this.refreshSchemas();

    autoBind(this);
  }

  setKeyValueTable(schema) {
    this.setState({ schema });
  }

  schemaListOptions() {
    let newOptions = [];
    const { userSchemaArr } = this.state;
    // must have label and value
    for (let i = 0; i < userSchemaArr.length; i++) {
      let { schema_name, user_id } = userSchemaArr[i];
      newOptions.push({ label: schema_name, value: { schema_name, user_id } })
    }
    return newOptions;
  }

  refreshSchemas() {
    fetch('/api/schema')
      .then(data => data.json())
      .then(data => this.setState({ userSchemaArr: data }))
      .catch(err => console.log('err in fetch', err));
  }

  handleCopySchema() {
    // create a fake element
    // need textarea to copy to clipboard
    let copyText = document.createElement('textarea');
    copyText.value = this.state.result;
    document.body.appendChild(copyText);

    // delete afterwards
    copyText.select();
    document.execCommand('copy');
    copyText.remove();

    // show message to the client
    let clipboardMessage = document.querySelector('.clipboard-message');
    clipboardMessage.innerText = 'Copied';
    clipboardMessage.style.display = 'block';
    setTimeout(() => {
      clipboardMessage.style.display = 'none';
    }, 650);

  }

  handleSaveSchema() {
    if (this.state.schema.schemaName.length === 0) {
      return alert('Schema Name must be filled out')
    }
    fetch('/api/schema', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.state.schema)
    })
      .then(this.refreshSchemas)
      .catch(console.log);
  }


  handleDeleteSchema() {
    fetch('/api/schema', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(this.state.deleteThisSchema)
    })
      .then(this.refreshSchemas);

  }


  handleCreateSchema(state) {
    const { schema: { schemaName, rows } } = this.state;

    // check if schemaname is filled out
    if (schemaName.trim() === '') {
      return this.setState({ result: 'Enter a schema name' });
    }

    for (let i = 0; i < rows.length; i += 1) {
      const { key, type } = rows[i];
      // check if key or type is empty
      if (key.trim() === '') return this.setState({ result: 'Assign name for all keys' });
      if (type.trim() === '') return this.setState({ result: 'Select type for all keys' });
    }

    const result = schemaGenerator(state);
    this.setState({ result });
    event.preventDefault();
  }

  handleSchemaName(event) {
    let schema = Object.assign({}, this.state.schema);
    schema.schemaName = event.target.value;
    this.setState({ schema });
  }

  createRow() {
    let schema = Object.assign({}, this.state.schema);
    let { rows } = schema;
    rows.push({
      key: '',
      type: '',
      options: {
        required: false
      }
    });
    this.setState({ schema });
  }

  deleteRow(rowIndex) {
    let schema = Object.assign({}, this.state.schema);
    let { rows } = schema;
    schema.rows = rows.filter((el, index) => {
      if (index === rowIndex) return false;
      return true;
    });
    this.setState({ schema });
  }

  updateRow(key, type, required) {
    let schema = Object.assign({}, this.state.schema);
    let { rows } = schema;

    rows[rows.length - 1] = {
      key,
      type,
      required
    };
    this.setState({ schema });
  }

  handleChangeRequired(event, rowIndex) {
    let schema = Object.assign({}, this.state.schema);
    let { rows } = schema;
    rows[rowIndex].options.required = event.target.checked;
    return this.setState({ schema });
  }

  handleChangeUnique(event, rowIndex) {
    let schema = Object.assign({}, this.state.schema);
    let { rows } = schema;
    rows[rowIndex].options.unique = event.target.checked;
    return this.setState({ schema });
  }

  handleChangeKey(event, rowIndex) {
    let schema = Object.assign({}, this.state.schema);
    let { rows } = schema;
    rows[rowIndex].key = event.target.value;
    return this.setState({ schema });
  }

  handleChangeType(selectedOption, rowIndex) {
    let schema = Object.assign({}, this.state.schema);
    let { rows } = schema;

    // clicking the 'x' button when nothing is in the dropdown box gives an error
    // to mitigate the error, if selectedOption is null, assign it to an empty string
    if (selectedOption === null) {
      selectedOption = '';
    }
    rows[rowIndex].type = selectedOption.label;
    return this.setState({ schema });
  }

  renderItem() {
    let newArr = [];
    for (let i = 0; i < this.state.userSchemaArr.length; i++) {
      newArr.push(<div>{this.state.userSchemaArr[i]}</div>)
    }
    return newArr
  }


  render() {
    return (
      <div id="dashboard">
        <LogoutButton />
        <img id="armadillo" src="Armadillo-icon.png" alt="armadillo" />
        <br />
        <SchemaName schemaName={this.state.schema.schemaName} handleSchemaName={this.handleSchemaName} />

        <div className='container'>
          <SchemaHeaders />
          <br />
          <Rows deleteRow={this.deleteRow}
            handleChangeRequired={this.handleChangeRequired}
            handleChangeUnique={this.handleChangeUnique}
            handleChangeKey={this.handleChangeKey}
            handleChangeType={this.handleChangeType}
            rows={this.state.schema.rows}
          />

          <SchemaStorage userSchemaArr={this.state.userSchemaArr} setKeyValueTable={this.setKeyValueTable} />

          <OptionButtons
            schema={this.state.schema}
            handleCreateSchema={this.handleCreateSchema}
            createRow={this.createRow}
            result={this.state.result}
            handleSaveSchema={this.handleSaveSchema}
            handleDeleteSchema={this.handleDeleteSchema}
          />

          <Select
            options={this.schemaListOptions()}
            closeMenuOnSelect='true'
            onChange={e => this.setState({ deleteThisSchema: e ? e.map(selection => selection.value) : [] })}
            placeholder="Select Schemas"
            isSearchable={true}
            isMulti={true}
          />

        </div>

        {/* <DeleteButton handleDeleteSchema={this.handleDeleteSchema} /> */}

        <pre onClick={this.handleCopySchema}>
          <div className='clipboard-message' />
          <code>{this.state.result}</code>
        </pre>
      </div>
    );
  }
}

export default Dashboard;

