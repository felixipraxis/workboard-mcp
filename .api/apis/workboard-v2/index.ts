import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core'
import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';

class SDK {
  spec: Oas;
  core: APICore;

  constructor() {
    this.spec = Oas.init(definition);
    this.core = new APICore(this.spec, 'workboard-v2/2.0 (api/6.1.3)');
  }

  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  config(config: ConfigOptions) {
    this.core.setConfig(config);
  }

  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  auth(...values: string[] | number[]) {
    this.core.setAuth(...values);
    return this;
  }

  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  server(url: string, variables = {}) {
    this.core.setServer(url, variables);
  }

  /**
   * Returns every active custom field definition (id, name, fieldType, options for selects,
   * objectType, and objectSubtype for work_item fields). Use this to discover attribute IDs
   * and names before reading or writing values.
   *
   * Omit `objectType` to receive definitions across every object type in a single response.
   *
   * @summary List custom field definitions for the org
   * @throws FetchError<400, types.CustomAttributesControllerGetDefinitionsResponse400> Invalid objectType
   * @throws FetchError<401, types.CustomAttributesControllerGetDefinitionsResponse401> Unauthorized
   * @throws FetchError<500, types.CustomAttributesControllerGetDefinitionsResponse500> Internal server or upstream failure
   */
  customAttributesController_getDefinitions(metadata?: types.CustomAttributesControllerGetDefinitionsMetadataParam): Promise<FetchResponse<200, types.CustomAttributesControllerGetDefinitionsResponse200>> {
    return this.core.fetch('/attributes/definitions', 'get', metadata);
  }

  /**
   * Returns objects in the caller's org that have a value set for the given custom
   * attribute, scoped to objects the caller can view.
   *
   * **Scope:**
   * - **Data-Admin** callers (including superusers) see every object org-wide.
   * - **Non-Data-Admin** callers on objective / key_result / work_item attributes see every
   * object they can view per-row (owner, team membership, explicit grant,
   * public-to-internal-people, etc., as enforced by wobo-okr for OKRs and by
   * Activity::canViewActionItem for work items). This matches the per-object GET
   * /api/custom_attribute/:id endpoint.
   * - **Non-Data-Admin** callers on user attributes see only their own user (at most one
   * row). This is intentionally stricter than the per-object endpoint.
   *
   * Results are ordered by object ID descending. Values for multi-select fields are returned
   * as string arrays; all other field types return a single string or null.
   *
   * **Pagination note:** for objective / key_result / work_item attributes a returned page
   * may contain fewer than `limit` rows even when more results exist — per-row visibility
   * filtering can exclude candidates from any given scan window. `nextOffset` reflects the
   * underlying scan position (not the filtered row count); paginate until `nextOffset` is
   * null.
   *
   * @summary List every object that has a value for a custom attribute
   * @throws FetchError<400, types.CustomAttributesControllerGetObjectsForAttributeResponse400> Invalid attributeId, limit, or offset
   * @throws FetchError<401, types.CustomAttributesControllerGetObjectsForAttributeResponse401> Unauthorized
   * @throws FetchError<404, types.CustomAttributesControllerGetObjectsForAttributeResponse404> Custom attribute not found
   * @throws FetchError<500, types.CustomAttributesControllerGetObjectsForAttributeResponse500> Internal server or upstream failure
   */
  customAttributesController_getObjectsForAttribute(metadata: types.CustomAttributesControllerGetObjectsForAttributeMetadataParam): Promise<FetchResponse<200, types.CustomAttributesControllerGetObjectsForAttributeResponse200>> {
    return this.core.fetch('/attributes/{attributeId}/objects', 'get', metadata);
  }

  /**
   * Get custom attribute values for an Objective
   *
   * @throws FetchError<401, types.CustomAttributesControllerGetObjectiveAttributesResponse401> Unauthorized
   * @throws FetchError<404, types.CustomAttributesControllerGetObjectiveAttributesResponse404> Objective not found, or the attributeId filter does not match a valid definition
   * @throws FetchError<500, types.CustomAttributesControllerGetObjectiveAttributesResponse500> Internal server or upstream failure
   */
  customAttributesController_getObjectiveAttributes(metadata: types.CustomAttributesControllerGetObjectiveAttributesMetadataParam): Promise<FetchResponse<200, types.CustomAttributesControllerGetObjectiveAttributesResponse200>> {
    return this.core.fetch('/attributes/objectives/{id}', 'get', metadata);
  }

  /**
   * Create (set) a custom attribute value on an Objective
   *
   * @throws FetchError<400, types.CustomAttributesControllerCreateObjectiveAttributeValueResponse400> Bad request, or a select value that is not registered for this custom attribute
   * @throws FetchError<401, types.CustomAttributesControllerCreateObjectiveAttributeValueResponse401> Unauthorized
   * @throws FetchError<403, types.CustomAttributesControllerCreateObjectiveAttributeValueResponse403> Forbidden — you can view this Objective but cannot edit it
   * @throws FetchError<404, types.CustomAttributesControllerCreateObjectiveAttributeValueResponse404> Objective not found, or the attribute is not available on this Objective
   * @throws FetchError<500, types.CustomAttributesControllerCreateObjectiveAttributeValueResponse500> Internal server or upstream failure
   */
  customAttributesController_createObjectiveAttributeValue(body: types.CustomAttributesControllerCreateObjectiveAttributeValueBodyParam, metadata: types.CustomAttributesControllerCreateObjectiveAttributeValueMetadataParam): Promise<FetchResponse<200, types.CustomAttributesControllerCreateObjectiveAttributeValueResponse200>> {
    return this.core.fetch('/attributes/objectives/{id}/{attributeId}', 'post', body, metadata);
  }

  /**
   * Update a custom attribute value on an Objective
   *
   * @throws FetchError<400, types.CustomAttributesControllerSetObjectiveAttributeValueResponse400> Bad request, or a select value that is not registered for this custom attribute
   * @throws FetchError<401, types.CustomAttributesControllerSetObjectiveAttributeValueResponse401> Unauthorized
   * @throws FetchError<403, types.CustomAttributesControllerSetObjectiveAttributeValueResponse403> Forbidden — you can view this Objective but cannot edit it
   * @throws FetchError<404, types.CustomAttributesControllerSetObjectiveAttributeValueResponse404> Objective not found, or the attribute is not available on this Objective
   * @throws FetchError<500, types.CustomAttributesControllerSetObjectiveAttributeValueResponse500> Internal server or upstream failure
   */
  customAttributesController_setObjectiveAttributeValue(body: types.CustomAttributesControllerSetObjectiveAttributeValueBodyParam, metadata: types.CustomAttributesControllerSetObjectiveAttributeValueMetadataParam): Promise<FetchResponse<200, types.CustomAttributesControllerSetObjectiveAttributeValueResponse200>> {
    return this.core.fetch('/attributes/objectives/{id}/{attributeId}', 'put', body, metadata);
  }

  /**
   * Clear a custom attribute value from an Objective
   *
   * @throws FetchError<401, types.CustomAttributesControllerDeleteObjectiveAttributeValueResponse401> Unauthorized
   * @throws FetchError<403, types.CustomAttributesControllerDeleteObjectiveAttributeValueResponse403> Forbidden — you can view this Objective but cannot edit it
   * @throws FetchError<404, types.CustomAttributesControllerDeleteObjectiveAttributeValueResponse404> Objective not found, or the attribute is not available on this Objective
   * @throws FetchError<500, types.CustomAttributesControllerDeleteObjectiveAttributeValueResponse500> Internal server or upstream failure
   */
  customAttributesController_deleteObjectiveAttributeValue(metadata: types.CustomAttributesControllerDeleteObjectiveAttributeValueMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/attributes/objectives/{id}/{attributeId}', 'delete', metadata);
  }

  /**
   * Get custom attribute values for a Key Result
   *
   * @throws FetchError<401, types.CustomAttributesControllerGetKeyResultAttributesResponse401> Unauthorized
   * @throws FetchError<404, types.CustomAttributesControllerGetKeyResultAttributesResponse404> Key Result not found, or the attributeId filter does not match a valid definition
   * @throws FetchError<500, types.CustomAttributesControllerGetKeyResultAttributesResponse500> Internal server or upstream failure
   */
  customAttributesController_getKeyResultAttributes(metadata: types.CustomAttributesControllerGetKeyResultAttributesMetadataParam): Promise<FetchResponse<200, types.CustomAttributesControllerGetKeyResultAttributesResponse200>> {
    return this.core.fetch('/attributes/key-results/{id}', 'get', metadata);
  }

  /**
   * Create (set) a custom attribute value on a Key Result
   *
   * @throws FetchError<400, types.CustomAttributesControllerCreateKeyResultAttributeValueResponse400> Bad request, or a select value that is not registered for this custom attribute
   * @throws FetchError<401, types.CustomAttributesControllerCreateKeyResultAttributeValueResponse401> Unauthorized
   * @throws FetchError<403, types.CustomAttributesControllerCreateKeyResultAttributeValueResponse403> Forbidden — you can view this Key Result but cannot edit it
   * @throws FetchError<404, types.CustomAttributesControllerCreateKeyResultAttributeValueResponse404> Key Result not found, or the attribute is not available on this Key Result
   * @throws FetchError<500, types.CustomAttributesControllerCreateKeyResultAttributeValueResponse500> Internal server or upstream failure
   */
  customAttributesController_createKeyResultAttributeValue(body: types.CustomAttributesControllerCreateKeyResultAttributeValueBodyParam, metadata: types.CustomAttributesControllerCreateKeyResultAttributeValueMetadataParam): Promise<FetchResponse<200, types.CustomAttributesControllerCreateKeyResultAttributeValueResponse200>> {
    return this.core.fetch('/attributes/key-results/{id}/{attributeId}', 'post', body, metadata);
  }

  /**
   * Update a custom attribute value on a Key Result
   *
   * @throws FetchError<400, types.CustomAttributesControllerSetKeyResultAttributeValueResponse400> Bad request, or a select value that is not registered for this custom attribute
   * @throws FetchError<401, types.CustomAttributesControllerSetKeyResultAttributeValueResponse401> Unauthorized
   * @throws FetchError<403, types.CustomAttributesControllerSetKeyResultAttributeValueResponse403> Forbidden — you can view this Key Result but cannot edit it
   * @throws FetchError<404, types.CustomAttributesControllerSetKeyResultAttributeValueResponse404> Key Result not found, or the attribute is not available on this Key Result
   * @throws FetchError<500, types.CustomAttributesControllerSetKeyResultAttributeValueResponse500> Internal server or upstream failure
   */
  customAttributesController_setKeyResultAttributeValue(body: types.CustomAttributesControllerSetKeyResultAttributeValueBodyParam, metadata: types.CustomAttributesControllerSetKeyResultAttributeValueMetadataParam): Promise<FetchResponse<200, types.CustomAttributesControllerSetKeyResultAttributeValueResponse200>> {
    return this.core.fetch('/attributes/key-results/{id}/{attributeId}', 'put', body, metadata);
  }

  /**
   * Clear a custom attribute value from a Key Result
   *
   * @throws FetchError<401, types.CustomAttributesControllerDeleteKeyResultAttributeValueResponse401> Unauthorized
   * @throws FetchError<403, types.CustomAttributesControllerDeleteKeyResultAttributeValueResponse403> Forbidden — you can view this Key Result but cannot edit it
   * @throws FetchError<404, types.CustomAttributesControllerDeleteKeyResultAttributeValueResponse404> Key Result not found, or the attribute is not available on this Key Result
   * @throws FetchError<500, types.CustomAttributesControllerDeleteKeyResultAttributeValueResponse500> Internal server or upstream failure
   */
  customAttributesController_deleteKeyResultAttributeValue(metadata: types.CustomAttributesControllerDeleteKeyResultAttributeValueMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/attributes/key-results/{id}/{attributeId}', 'delete', metadata);
  }

  /**
   * Get custom attribute values for a Work Item
   *
   * @throws FetchError<401, types.CustomAttributesControllerGetWorkItemAttributesResponse401> Unauthorized
   * @throws FetchError<404, types.CustomAttributesControllerGetWorkItemAttributesResponse404> Work item not found, or the attributeId filter does not match a valid definition
   * @throws FetchError<500, types.CustomAttributesControllerGetWorkItemAttributesResponse500> Internal server or upstream failure
   */
  customAttributesController_getWorkItemAttributes(metadata: types.CustomAttributesControllerGetWorkItemAttributesMetadataParam): Promise<FetchResponse<200, types.CustomAttributesControllerGetWorkItemAttributesResponse200>> {
    return this.core.fetch('/attributes/work-items/{id}', 'get', metadata);
  }

  /**
   * Create (set) a custom attribute value on a Work Item
   *
   * @throws FetchError<400, types.CustomAttributesControllerCreateWorkItemAttributeValueResponse400> Bad request, or a select value that is not registered for this custom attribute
   * @throws FetchError<401, types.CustomAttributesControllerCreateWorkItemAttributeValueResponse401> Unauthorized
   * @throws FetchError<404, types.CustomAttributesControllerCreateWorkItemAttributeValueResponse404> Work item not found, or the attribute is not available on this Work Item
   * @throws FetchError<500, types.CustomAttributesControllerCreateWorkItemAttributeValueResponse500> Internal server or upstream failure
   */
  customAttributesController_createWorkItemAttributeValue(body: types.CustomAttributesControllerCreateWorkItemAttributeValueBodyParam, metadata: types.CustomAttributesControllerCreateWorkItemAttributeValueMetadataParam): Promise<FetchResponse<200, types.CustomAttributesControllerCreateWorkItemAttributeValueResponse200>> {
    return this.core.fetch('/attributes/work-items/{id}/{attributeId}', 'post', body, metadata);
  }

  /**
   * Update a custom attribute value on a Work Item
   *
   * @throws FetchError<400, types.CustomAttributesControllerSetWorkItemAttributeValueResponse400> Bad request, or a select value that is not registered for this custom attribute
   * @throws FetchError<401, types.CustomAttributesControllerSetWorkItemAttributeValueResponse401> Unauthorized
   * @throws FetchError<404, types.CustomAttributesControllerSetWorkItemAttributeValueResponse404> Work item not found, or the attribute is not available on this Work Item
   * @throws FetchError<500, types.CustomAttributesControllerSetWorkItemAttributeValueResponse500> Internal server or upstream failure
   */
  customAttributesController_setWorkItemAttributeValue(body: types.CustomAttributesControllerSetWorkItemAttributeValueBodyParam, metadata: types.CustomAttributesControllerSetWorkItemAttributeValueMetadataParam): Promise<FetchResponse<200, types.CustomAttributesControllerSetWorkItemAttributeValueResponse200>> {
    return this.core.fetch('/attributes/work-items/{id}/{attributeId}', 'put', body, metadata);
  }

  /**
   * Clear a custom attribute value from a Work Item
   *
   * @throws FetchError<401, types.CustomAttributesControllerDeleteWorkItemAttributeValueResponse401> Unauthorized
   * @throws FetchError<404, types.CustomAttributesControllerDeleteWorkItemAttributeValueResponse404> Work item not found, or the attribute is not available on this Work Item
   * @throws FetchError<500, types.CustomAttributesControllerDeleteWorkItemAttributeValueResponse500> Internal server or upstream failure
   */
  customAttributesController_deleteWorkItemAttributeValue(metadata: types.CustomAttributesControllerDeleteWorkItemAttributeValueMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/attributes/work-items/{id}/{attributeId}', 'delete', metadata);
  }

  /**
   * Returns custom attribute values for a user. A regular token may only read its own user
   * ID. A **Data Admin Token** (issued via WBAdmin) may read any user in the org.
   *
   * @summary Get custom attribute values for a User
   * @throws FetchError<401, types.CustomAttributesControllerGetUserAttributesResponse401> Unauthorized
   * @throws FetchError<403, types.CustomAttributesControllerGetUserAttributesResponse403> Forbidden — requires a Data Admin Token to access another user
   * @throws FetchError<404, types.CustomAttributesControllerGetUserAttributesResponse404> User not found, or the attributeId filter does not match a valid definition
   * @throws FetchError<500, types.CustomAttributesControllerGetUserAttributesResponse500> Internal server or upstream failure
   */
  customAttributesController_getUserAttributes(metadata: types.CustomAttributesControllerGetUserAttributesMetadataParam): Promise<FetchResponse<200, types.CustomAttributesControllerGetUserAttributesResponse200>> {
    return this.core.fetch('/attributes/users/{id}', 'get', metadata);
  }

  /**
   * Requires a **Data Admin Token** to write attributes on behalf of another user.
   *
   * @summary Create (set) a custom attribute value on a User
   * @throws FetchError<400, types.CustomAttributesControllerCreateUserAttributeValueResponse400> Bad request, or a select value that is not registered for this custom attribute
   * @throws FetchError<401, types.CustomAttributesControllerCreateUserAttributeValueResponse401> Unauthorized
   * @throws FetchError<403, types.CustomAttributesControllerCreateUserAttributeValueResponse403> Forbidden — requires a Data Admin Token
   * @throws FetchError<404, types.CustomAttributesControllerCreateUserAttributeValueResponse404> User not found, or the attribute is not available on this User
   * @throws FetchError<500, types.CustomAttributesControllerCreateUserAttributeValueResponse500> Internal server or upstream failure
   */
  customAttributesController_createUserAttributeValue(body: types.CustomAttributesControllerCreateUserAttributeValueBodyParam, metadata: types.CustomAttributesControllerCreateUserAttributeValueMetadataParam): Promise<FetchResponse<200, types.CustomAttributesControllerCreateUserAttributeValueResponse200>> {
    return this.core.fetch('/attributes/users/{id}/{attributeId}', 'post', body, metadata);
  }

  /**
   * Requires a **Data Admin Token** to update attributes on behalf of another user.
   *
   * @summary Update a custom attribute value on a User
   * @throws FetchError<400, types.CustomAttributesControllerSetUserAttributeValueResponse400> Bad request, or a select value that is not registered for this custom attribute
   * @throws FetchError<401, types.CustomAttributesControllerSetUserAttributeValueResponse401> Unauthorized
   * @throws FetchError<403, types.CustomAttributesControllerSetUserAttributeValueResponse403> Forbidden — requires a Data Admin Token
   * @throws FetchError<404, types.CustomAttributesControllerSetUserAttributeValueResponse404> User not found, or the attribute is not available on this User
   * @throws FetchError<500, types.CustomAttributesControllerSetUserAttributeValueResponse500> Internal server or upstream failure
   */
  customAttributesController_setUserAttributeValue(body: types.CustomAttributesControllerSetUserAttributeValueBodyParam, metadata: types.CustomAttributesControllerSetUserAttributeValueMetadataParam): Promise<FetchResponse<200, types.CustomAttributesControllerSetUserAttributeValueResponse200>> {
    return this.core.fetch('/attributes/users/{id}/{attributeId}', 'put', body, metadata);
  }

  /**
   * Requires a **Data Admin Token** to delete attributes on behalf of another user.
   *
   * @summary Clear a custom attribute value from a User
   * @throws FetchError<401, types.CustomAttributesControllerDeleteUserAttributeValueResponse401> Unauthorized
   * @throws FetchError<403, types.CustomAttributesControllerDeleteUserAttributeValueResponse403> Forbidden — requires a Data Admin Token
   * @throws FetchError<404, types.CustomAttributesControllerDeleteUserAttributeValueResponse404> User not found, or the attribute is not available on this User
   * @throws FetchError<500, types.CustomAttributesControllerDeleteUserAttributeValueResponse500> Internal server or upstream failure
   */
  customAttributesController_deleteUserAttributeValue(metadata: types.CustomAttributesControllerDeleteUserAttributeValueMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/attributes/users/{id}/{attributeId}', 'delete', metadata);
  }
}

const createSDK = (() => { return new SDK(); })()
;

export default createSDK;

export type { CustomAttributesControllerCreateKeyResultAttributeValueBodyParam, CustomAttributesControllerCreateKeyResultAttributeValueMetadataParam, CustomAttributesControllerCreateKeyResultAttributeValueResponse200, CustomAttributesControllerCreateKeyResultAttributeValueResponse400, CustomAttributesControllerCreateKeyResultAttributeValueResponse401, CustomAttributesControllerCreateKeyResultAttributeValueResponse403, CustomAttributesControllerCreateKeyResultAttributeValueResponse404, CustomAttributesControllerCreateKeyResultAttributeValueResponse500, CustomAttributesControllerCreateObjectiveAttributeValueBodyParam, CustomAttributesControllerCreateObjectiveAttributeValueMetadataParam, CustomAttributesControllerCreateObjectiveAttributeValueResponse200, CustomAttributesControllerCreateObjectiveAttributeValueResponse400, CustomAttributesControllerCreateObjectiveAttributeValueResponse401, CustomAttributesControllerCreateObjectiveAttributeValueResponse403, CustomAttributesControllerCreateObjectiveAttributeValueResponse404, CustomAttributesControllerCreateObjectiveAttributeValueResponse500, CustomAttributesControllerCreateUserAttributeValueBodyParam, CustomAttributesControllerCreateUserAttributeValueMetadataParam, CustomAttributesControllerCreateUserAttributeValueResponse200, CustomAttributesControllerCreateUserAttributeValueResponse400, CustomAttributesControllerCreateUserAttributeValueResponse401, CustomAttributesControllerCreateUserAttributeValueResponse403, CustomAttributesControllerCreateUserAttributeValueResponse404, CustomAttributesControllerCreateUserAttributeValueResponse500, CustomAttributesControllerCreateWorkItemAttributeValueBodyParam, CustomAttributesControllerCreateWorkItemAttributeValueMetadataParam, CustomAttributesControllerCreateWorkItemAttributeValueResponse200, CustomAttributesControllerCreateWorkItemAttributeValueResponse400, CustomAttributesControllerCreateWorkItemAttributeValueResponse401, CustomAttributesControllerCreateWorkItemAttributeValueResponse404, CustomAttributesControllerCreateWorkItemAttributeValueResponse500, CustomAttributesControllerDeleteKeyResultAttributeValueMetadataParam, CustomAttributesControllerDeleteKeyResultAttributeValueResponse401, CustomAttributesControllerDeleteKeyResultAttributeValueResponse403, CustomAttributesControllerDeleteKeyResultAttributeValueResponse404, CustomAttributesControllerDeleteKeyResultAttributeValueResponse500, CustomAttributesControllerDeleteObjectiveAttributeValueMetadataParam, CustomAttributesControllerDeleteObjectiveAttributeValueResponse401, CustomAttributesControllerDeleteObjectiveAttributeValueResponse403, CustomAttributesControllerDeleteObjectiveAttributeValueResponse404, CustomAttributesControllerDeleteObjectiveAttributeValueResponse500, CustomAttributesControllerDeleteUserAttributeValueMetadataParam, CustomAttributesControllerDeleteUserAttributeValueResponse401, CustomAttributesControllerDeleteUserAttributeValueResponse403, CustomAttributesControllerDeleteUserAttributeValueResponse404, CustomAttributesControllerDeleteUserAttributeValueResponse500, CustomAttributesControllerDeleteWorkItemAttributeValueMetadataParam, CustomAttributesControllerDeleteWorkItemAttributeValueResponse401, CustomAttributesControllerDeleteWorkItemAttributeValueResponse404, CustomAttributesControllerDeleteWorkItemAttributeValueResponse500, CustomAttributesControllerGetDefinitionsMetadataParam, CustomAttributesControllerGetDefinitionsResponse200, CustomAttributesControllerGetDefinitionsResponse400, CustomAttributesControllerGetDefinitionsResponse401, CustomAttributesControllerGetDefinitionsResponse500, CustomAttributesControllerGetKeyResultAttributesMetadataParam, CustomAttributesControllerGetKeyResultAttributesResponse200, CustomAttributesControllerGetKeyResultAttributesResponse401, CustomAttributesControllerGetKeyResultAttributesResponse404, CustomAttributesControllerGetKeyResultAttributesResponse500, CustomAttributesControllerGetObjectiveAttributesMetadataParam, CustomAttributesControllerGetObjectiveAttributesResponse200, CustomAttributesControllerGetObjectiveAttributesResponse401, CustomAttributesControllerGetObjectiveAttributesResponse404, CustomAttributesControllerGetObjectiveAttributesResponse500, CustomAttributesControllerGetObjectsForAttributeMetadataParam, CustomAttributesControllerGetObjectsForAttributeResponse200, CustomAttributesControllerGetObjectsForAttributeResponse400, CustomAttributesControllerGetObjectsForAttributeResponse401, CustomAttributesControllerGetObjectsForAttributeResponse404, CustomAttributesControllerGetObjectsForAttributeResponse500, CustomAttributesControllerGetUserAttributesMetadataParam, CustomAttributesControllerGetUserAttributesResponse200, CustomAttributesControllerGetUserAttributesResponse401, CustomAttributesControllerGetUserAttributesResponse403, CustomAttributesControllerGetUserAttributesResponse404, CustomAttributesControllerGetUserAttributesResponse500, CustomAttributesControllerGetWorkItemAttributesMetadataParam, CustomAttributesControllerGetWorkItemAttributesResponse200, CustomAttributesControllerGetWorkItemAttributesResponse401, CustomAttributesControllerGetWorkItemAttributesResponse404, CustomAttributesControllerGetWorkItemAttributesResponse500, CustomAttributesControllerSetKeyResultAttributeValueBodyParam, CustomAttributesControllerSetKeyResultAttributeValueMetadataParam, CustomAttributesControllerSetKeyResultAttributeValueResponse200, CustomAttributesControllerSetKeyResultAttributeValueResponse400, CustomAttributesControllerSetKeyResultAttributeValueResponse401, CustomAttributesControllerSetKeyResultAttributeValueResponse403, CustomAttributesControllerSetKeyResultAttributeValueResponse404, CustomAttributesControllerSetKeyResultAttributeValueResponse500, CustomAttributesControllerSetObjectiveAttributeValueBodyParam, CustomAttributesControllerSetObjectiveAttributeValueMetadataParam, CustomAttributesControllerSetObjectiveAttributeValueResponse200, CustomAttributesControllerSetObjectiveAttributeValueResponse400, CustomAttributesControllerSetObjectiveAttributeValueResponse401, CustomAttributesControllerSetObjectiveAttributeValueResponse403, CustomAttributesControllerSetObjectiveAttributeValueResponse404, CustomAttributesControllerSetObjectiveAttributeValueResponse500, CustomAttributesControllerSetUserAttributeValueBodyParam, CustomAttributesControllerSetUserAttributeValueMetadataParam, CustomAttributesControllerSetUserAttributeValueResponse200, CustomAttributesControllerSetUserAttributeValueResponse400, CustomAttributesControllerSetUserAttributeValueResponse401, CustomAttributesControllerSetUserAttributeValueResponse403, CustomAttributesControllerSetUserAttributeValueResponse404, CustomAttributesControllerSetUserAttributeValueResponse500, CustomAttributesControllerSetWorkItemAttributeValueBodyParam, CustomAttributesControllerSetWorkItemAttributeValueMetadataParam, CustomAttributesControllerSetWorkItemAttributeValueResponse200, CustomAttributesControllerSetWorkItemAttributeValueResponse400, CustomAttributesControllerSetWorkItemAttributeValueResponse401, CustomAttributesControllerSetWorkItemAttributeValueResponse404, CustomAttributesControllerSetWorkItemAttributeValueResponse500 } from './types';
