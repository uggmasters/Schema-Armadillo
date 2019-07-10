import React, { Component } from 'react';
import '.././styles/Dashboard.css';
import KeyValue from './KeyValue';
import schemaGenerator from '../../utils/modelCodeMaker2';
import LogoutButton from './LogoutButton';
import SchemaStorage from './SchemaStorage.jsx';
import SchemaName from './SchemaName';
import SchemaHeaders from './SchemaHeaders'
import Rows from './Rows'

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
    };

    this.refreshSchemas();

    this.refreshSchemas = this.refreshSchemas.bind(this);
    this.handleSchemaName = this.handleSchemaName.bind(this);
    this.createRow = this.createRow.bind(this);
    this.handleCreateSchema = this.handleCreateSchema.bind(this);
    this.updateRow = this.updateRow.bind(this);
    this.deleteRow = this.deleteRow.bind(this);
    this.handleChangeRequired = this.handleChangeRequired.bind(this);
    this.handleChangeUnique = this.handleChangeUnique.bind(this);
    this.handleChangeKey = this.handleChangeKey.bind(this);
    this.handleChangeType = this.handleChangeType.bind(this);
    this.handleSaveSchema = this.handleSaveSchema.bind(this);
    this.handleCopySchema = this.handleCopySchema.bind(this);
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
  if(this.state.schema.schemaName.length === 0){
    return alert('Schema Name must be filled out')
  }
    fetch('/api/schema', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.state.schema)
    })
      .then(this.refreshSchemas);
  }

  handleCreateSchema(state) {
    // check if schemaname is filled out
    if (this.state.schema.schemaName.trim() === '') {
      return this.setState({ result: 'Enter a schema name' });
    }

    let rows = this.state.schema.rows;
    for (let i = 0; i < rows.length; i += 1) {
      // check if key or type is empty
      if (rows[i].key.trim() === '')
        return this.setState({ result: 'Assign name for all keys' });
      if (rows[i].type.trim() === '')
        return this.setState({ result: 'Select type for all keys' });
    }

    let result = schemaGenerator(state);
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

  render() {
 
    return (
      <div>
        <LogoutButton />
        <br/>
        <SchemaName schemaName = {this.state.schema.schemaName} handleSchemaName={this.handleSchemaName} />
        <br/>

        <div className='container'>
          <SchemaHeaders />   
          <br/>
          <Rows deleteRow={this.deleteRow}
          handleChangeRequired={this.handleChangeRequired}
          handleChangeUnique={this.handleChangeUnique}
          handleChangeKey={this.handleChangeKey}
          handleChangeType={this.handleChangeType}
          rows = {this.state.schema.rows}
          />
         
          <SchemaStorage userSchemaArr={this.state.userSchemaArr} />
          
          <div className="buttons">
            <OptionButtons />

            <button
              className="submit"
              onClick={() => this.handleCreateSchema(this.state.schema)}
              type="button"
            >
              Create Schema
            </button>
            <button
              className='createrow'
              onClick={this.createRow}
              type="button"
            >
              Add a New Key
            </button>
          </div>
        </div>
        <button
          className='saveButton'
          onClick={this.handleSaveSchema}
          type="button"
        >
          Save
        </button>

        <pre onClick={this.handleCopySchema}>
          <div className='clipboard-message' />
          <code>{this.state.result}</code>
        </pre>
      </div>
    );
  }
}

export default Dashboard;

