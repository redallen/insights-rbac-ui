import React, { useEffect, useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import componentTypes from '@data-driven-forms/react-form-renderer/dist/esm/component-types';
import validatorTypes from '@data-driven-forms/react-form-renderer/dist/esm/validator-types';
import componentMapper from '@data-driven-forms/pf4-component-mapper/dist/esm/component-mapper';
import ModalFormTemplate from '../common/ModalFormTemplate';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import FormRenderer from '../common/form-renderer';
import { fetchGroup, updateGroup } from '../../redux/actions/group-actions';
import { Skeleton } from '@patternfly/react-core';
import { debouncedAsyncValidator } from './validators';

const EditGroupModal = ({ addNotification, updateGroup, postMethod, pagination, closeUrl, group, onClose }) => {
  const [selectedGroup, setSelectedGroup] = useState(undefined);

  const history = useHistory();
  const match = useRouteMatch('/groups/edit/:id');

  const setGroupData = (groupData) => {
    setSelectedGroup(groupData);
  };

  const fetchData = () => {
    match &&
      fetchGroup(match.params.id)
        .payload.then((data) => setGroupData(data))
        .catch(() => setGroupData(undefined));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setSelectedGroup(group);
  }, [group]);

  const onSubmit = (data) => {
    const user_data = { ...data };
    postMethod
      ? updateGroup(user_data)
          .then(() => postMethod({ limit: pagination.limit }))
          .then(history.push(closeUrl))
      : updateGroup(user_data).then(() => history.push(closeUrl));
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      dismissDelay: 8000,
      dismissable: false,
      title: selectedGroup ? 'Editing group' : 'Adding group',
      description: selectedGroup ? 'Edit group was canceled by the user.' : 'Adding group was canceled by the user.',
    });
    onClose();
    history.push(closeUrl);
  };

  const schema = {
    fields: [
      {
        name: 'name',
        label: 'Name',
        component: selectedGroup ? componentTypes.TEXT_FIELD : 'skeleton',
        ...(selectedGroup ? { validateOnMount: true } : {}),
        validate: [
          { type: 'validate-group-name', id: match ? match.params.id : group.id, idKey: 'uuid' },
          {
            type: validatorTypes.REQUIRED,
          },
        ],
      },
      {
        name: 'description',
        label: 'Description',
        component: selectedGroup ? componentTypes.TEXTAREA : 'skeleton',
        validate: [
          {
            type: validatorTypes.MAX_LENGTH,
            threshold: 150,
          },
        ],
      },
    ],
  };

  const validatorMapper = {
    'validate-group-name': ({ idKey, id }) => (value) => debouncedAsyncValidator(value, idKey, id),
  };

  return (
    <FormRenderer
      schema={schema}
      componentMapper={{
        ...componentMapper,
        skeleton: Skeleton,
      }}
      onCancel={onCancel}
      onSubmit={onSubmit}
      validatorMapper={validatorMapper}
      initialValues={{ ...selectedGroup }}
      FormTemplate={(props) => (
        <ModalFormTemplate {...props} ModalProps={{ onClose: onCancel, isOpen: true, variant: 'medium', title: `Edit group's information` }} />
      )}
    />
  );
};

EditGroupModal.defaultProps = {
  closeUrl: '/groups',
  onClose: () => null,
  onSubmit: () => null,
};

EditGroupModal.propTypes = {
  addNotification: PropTypes.func.isRequired,
  fetchGroup: PropTypes.func.isRequired,
  inputValue: PropTypes.string,
  updateGroup: PropTypes.func.isRequired,
  postMethod: PropTypes.func,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
  }).isRequired,
  closeUrl: PropTypes.string,
  group: PropTypes.object,
  onClose: PropTypes.func,
};

const mapStateToProps = ({ groupReducer: { isLoading } }) => ({
  isLoading,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      addNotification,
      updateGroup,
      fetchGroup,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(EditGroupModal);
