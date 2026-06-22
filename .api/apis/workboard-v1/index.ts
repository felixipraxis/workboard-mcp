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
    this.core = new APICore(this.spec, 'workboard-v1/1.0.0 (api/6.1.3)');
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
   * **Without any parameters, this will return the user profile associated with the token.
   * If the token is a 'Data-Admin' token, some parameters will return a different result.**
   *
   * @summary Get an individual user, or all users with a Data-Admin token.
   * @throws FetchError<400, types.GetUserResponse400> Unauthorized / Invalid
   * @throws FetchError<409, types.GetUserResponse409> Conflict
   */
  getUser(metadata?: types.GetUserMetadataParam): Promise<FetchResponse<200, types.GetUserResponse200>> {
    return this.core.fetch('/user', 'get', metadata);
  }

  /**
   * `Data-Admin` token can create a user.
   *
   * @summary Data-Admin: Create a user
   * @throws FetchError<400, types.PostUserResponse400> Unauthorized / Invalid
   * @throws FetchError<409, types.PostUserResponse409> Conflict
   */
  postUser(body: types.PostUserBodyParam): Promise<FetchResponse<200, types.PostUserResponse200>> {
    return this.core.fetch('/user', 'post', body);
  }

  /**
   * Deactivate a user
   *
   * @throws FetchError<400, types.PatchUserResponse400> Unauthorized / Invalid
   */
  patchUser(body: types.PatchUserBodyParam, metadata?: types.PatchUserMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/user', 'patch', body, metadata);
  }

  /**
   * **`Data-Admin` tokens can get an individual user with the `user_id_path` parameter.**
   *
   * @summary Data-Admin: Get user by `user_id_path`
   * @throws FetchError<400, types.GetUserUserIdPathResponse400> Unauthorized / Invalid
   */
  getUserUser_id_path(metadata: types.GetUserUserIdPathMetadataParam): Promise<FetchResponse<200, types.GetUserUserIdPathResponse200>> {
    return this.core.fetch('/user/{user_id_path}', 'get', metadata);
  }

  /**
   * Update a user and/or reactivate a user.
   *
   * @throws FetchError<400, types.PutUserUserIdPathResponse400> Unauthorized / Invalid
   * @throws FetchError<409, types.PutUserUserIdPathResponse409> Conflict
   */
  putUserUser_id_path(body: types.PutUserUserIdPathBodyParam, metadata: types.PutUserUserIdPathMetadataParam): Promise<FetchResponse<200, types.PutUserUserIdPathResponse200>>;
  putUserUser_id_path(metadata: types.PutUserUserIdPathMetadataParam): Promise<FetchResponse<200, types.PutUserUserIdPathResponse200>>;
  putUserUser_id_path(body?: types.PutUserUserIdPathBodyParam | types.PutUserUserIdPathMetadataParam, metadata?: types.PutUserUserIdPathMetadataParam): Promise<FetchResponse<200, types.PutUserUserIdPathResponse200>> {
    return this.core.fetch('/user/{user_id_path}', 'put', body, metadata);
  }

  /**
   * **This will return the user and a goal object with an individual object for each goal's
   * details.**
   *
   * @summary Get all of a user's goals.
   * @throws FetchError<400, types.GetUserUserIdPathGoalResponse400> Unauthorized / Invalid
   */
  getUserUser_id_pathGoal(metadata: types.GetUserUserIdPathGoalMetadataParam): Promise<FetchResponse<200, types.GetUserUserIdPathGoalResponse200>> {
    return this.core.fetch('/user/{user_id_path}/goal', 'get', metadata);
  }

  /**
   * **This will return the user and a single goal object.**
   *
   * @summary Get a user's specific goal.
   * @throws FetchError<400, types.GetUserUserIdPathGoalGoalIdPathResponse400> Unauthorized / Invalid
   */
  getUserUser_id_pathGoalGoal_id_path(metadata: types.GetUserUserIdPathGoalGoalIdPathMetadataParam): Promise<FetchResponse<200, types.GetUserUserIdPathGoalGoalIdPathResponse200>> {
    return this.core.fetch('/user/{user_id_path}/goal/{goal_id_path}', 'get', metadata);
  }

  /**
   * Get a team or teams that the user token is a member of. If the token is a Data-Admin
   * token, get all teams or a single team.
   *
   * @throws FetchError<400, types.GetTeamResponse400> Unauthorized / Invalid
   */
  getTeam(metadata?: types.GetTeamMetadataParam): Promise<FetchResponse<200, types.GetTeamResponse200>> {
    return this.core.fetch('/team', 'get', metadata);
  }

  /**
   * Create a new functional team or working group, and add Workstreams and team members.
   *
   * @throws FetchError<400, types.PostTeamResponse400> Unauthorized / Invalid
   */
  postTeam(body: types.PostTeamBodyParam): Promise<FetchResponse<200, types.PostTeamResponse200>> {
    return this.core.fetch('/team', 'post', body);
  }

  /**
   * **CAUTION**: Delete an entire team and all its Workstreams and action items. A
   * successful request will return a 204 code. If you are deleting a functional team, the
   * child teams will be deleted as well.
   *
   * @summary Delete a team.
   * @throws FetchError<400, types.PatchTeamResponse400> Unauthorized / Invalid
   */
  patchTeam(metadata: types.PatchTeamMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/team', 'patch', metadata);
  }

  /**
   * Get a team that the user token is a member of. If the token is a Data-Admin token, get a
   * single team that user is not a part of.
   *
   * @throws FetchError<400, types.GetTeamTeamIdPathResponse400> Unauthorized / Invalid
   */
  getTeamTeam_id_path(metadata: types.GetTeamTeamIdPathMetadataParam): Promise<FetchResponse<200, types.GetTeamTeamIdPathResponse200>> {
    return this.core.fetch('/team/{team_id_path}', 'get', metadata);
  }

  /**
   * Change the name of a team, add new and existing users to the team roster, change a
   * member's role on the team, remove users from the team, or add new Workstreams. If you
   * are using a personal access token, you must be the manager of the team to use this
   * request.<br/>Note: If you update a team with a new manager, the previous manager will be
   * demoted to a co-manager.
   *
   * @summary Update a team.
   * @throws FetchError<400, types.PutTeamTeamIdPathResponse400> Unauthorized / Invalid
   */
  putTeamTeam_id_path(body: types.PutTeamTeamIdPathBodyParam, metadata: types.PutTeamTeamIdPathMetadataParam): Promise<FetchResponse<200, types.PutTeamTeamIdPathResponse200>>;
  putTeamTeam_id_path(metadata: types.PutTeamTeamIdPathMetadataParam): Promise<FetchResponse<200, types.PutTeamTeamIdPathResponse200>>;
  putTeamTeam_id_path(body?: types.PutTeamTeamIdPathBodyParam | types.PutTeamTeamIdPathMetadataParam, metadata?: types.PutTeamTeamIdPathMetadataParam): Promise<FetchResponse<200, types.PutTeamTeamIdPathResponse200>> {
    return this.core.fetch('/team/{team_id_path}', 'put', body, metadata);
  }

  /**
   * Get all Workstreams belonging to the specified team.
   *
   * @summary Get all Workstreams belonging to the specified team.
   * @throws FetchError<400, types.GetTeamTeamIdPathWorkstreamResponse400> Unauthorized / Invalid
   */
  getTeamTeam_id_pathWorkstream(metadata: types.GetTeamTeamIdPathWorkstreamMetadataParam): Promise<FetchResponse<200, types.GetTeamTeamIdPathWorkstreamResponse200>> {
    return this.core.fetch('/team/{team_id_path}/workstream', 'get', metadata);
  }

  /**
   * List details of all action items belonging to the specified team.
   *
   * @summary List details of all action items belonging to the specified team.
   * @throws FetchError<400, types.GetTeamTeamIdPathActivityResponse400> Unauthorized / Invalid
   */
  getTeamTeam_id_pathActivity(metadata: types.GetTeamTeamIdPathActivityMetadataParam): Promise<FetchResponse<200, types.GetTeamTeamIdPathActivityResponse200>> {
    return this.core.fetch('/team/{team_id_path}/activity', 'get', metadata);
  }

  /**
   * Get Goals using parameters to filter results.
   *
   * @throws FetchError<400, types.GetGoalResponse400> Unauthorized / Invalid
   */
  getGoal(metadata?: types.GetGoalMetadataParam): Promise<FetchResponse<200, types.GetGoalResponse200>> {
    return this.core.fetch('/goal', 'get', metadata);
  }

  /**
   * Create a goal for a user in your organization, including metrics sourced from the same
   * person. Make sure you have `Data-Admin` permission for your access token.
   *
   * @summary Create a goal for a user in your organization, including metrics sourced from the same
   * person. Make sure you have `Data-Admin` permission for your access token.
   * @throws FetchError<400, types.PostGoalResponse400> Unauthorized / Invalid
   */
  postGoal(body: types.PostGoalBodyParam): Promise<FetchResponse<200, types.PostGoalResponse200>> {
    return this.core.fetch('/goal', 'post', body);
  }

  /**
   * Get Goals using parameters to filter results.
   *
   * @throws FetchError<400, types.GetGoalGoalIdPathResponse400> Unauthorized / Invalid
   */
  getGoalGoal_id_path(metadata: types.GetGoalGoalIdPathMetadataParam): Promise<FetchResponse<200, types.GetGoalGoalIdPathResponse200>> {
    return this.core.fetch('/goal/{goal_id_path}', 'get', metadata);
  }

  /**
   * List data for one metric (specified by the metric_id parameter) associated with the goal
   * specified by the goal_id parameter.
   *
   * @summary List data for one metric (specified by the metric_id parameter) associated with the goal
   * specified by the goal_id parameter.
   * @throws FetchError<400, types.GetGoalGoalIdPathMetricMetricIdPathResponse400> Unauthorized / Invalid
   */
  getGoalGoal_id_pathMetricMetric_id_path(metadata: types.GetGoalGoalIdPathMetricMetricIdPathMetadataParam): Promise<FetchResponse<200, types.GetGoalGoalIdPathMetricMetricIdPathResponse200>> {
    return this.core.fetch('/goal/{goal_id_path}/metric/{metric_id_path}', 'get', metadata);
  }

  /**
   * List the associated `strategies` and `pillars` to which the `goal_id_path` is related.
   * Note, the logged in user must have Data-Admin permission and have access to WorkBoard
   * Strategy in order to view the goal pillars.
   *
   * @summary Get a Goal's associated `strategies` and `pillars` from WorkBoard Strategy. Note, the
   * logged in user must have Data-Admin permission and have access to WorkBoard Strategy in
   * order to view the goal pillars.
   * @throws FetchError<400, types.GetGoalGoalIdPathPillarsResponse400> Unauthorized / Invalid
   */
  getGoalGoal_id_pathPillars(metadata: types.GetGoalGoalIdPathPillarsMetadataParam): Promise<FetchResponse<200, types.GetGoalGoalIdPathPillarsResponse200>> {
    return this.core.fetch('/goal/{goal_id_path}/pillars', 'get', metadata);
  }

  /**
   * List aligned and dependent goals associated with the goal specified by the `goal_id`
   * parameter. Note, the logged in user must have `Data-Admin` permission in order to view
   * the goal alignment. If `goal_id` is aligned to another goal, the first goal returned
   * will be the goal that `goal_id` is aligned to. If `goal_id` is not aligned and has goals
   * aligned to it, `goal_id` will be the first goal. If `goal_id` has no aligned goals, then
   * `goal_id` goal will be returned without any `goal_alignments`.
   *
   * @summary List aligned and dependent goals associated with the goal specified by the goal_id
   * parameter. Note, the logged in user must have Data-Admin permission in order to view the
   * goal alignment.
   * @throws FetchError<400, types.GetGoalGoalIdPathAlignmentResponse400> Unauthorized / Invalid
   */
  getGoalGoal_id_pathAlignment(metadata: types.GetGoalGoalIdPathAlignmentMetadataParam): Promise<FetchResponse<200, types.GetGoalGoalIdPathAlignmentResponse200>> {
    return this.core.fetch('/goal/{goal_id_path}/alignment', 'get', metadata);
  }

  /**
   * By default, when no additional parameters are passed, this returns the Metrics the token
   * owner has ownership of. If the token owner doesn't own any Metrics, the results will be
   * empty.
   *
   * @summary Request metrics (key results) the user (token owner) has access to. Use a Data-Admin
   * token to gain access to metrics across your organization.
   * @throws FetchError<400, types.GetMetricResponse400> Unauthorized / Invalid
   */
  getMetric(metadata?: types.GetMetricMetadataParam): Promise<FetchResponse<200, types.GetMetricResponse200>> {
    return this.core.fetch('/metric', 'get', metadata);
  }

  /**
   * GET a single individual metric (key results) the user has access to. Use a `Data-Admin`
   * token to get an organization's single metric.
   *
   * @throws FetchError<400, types.GetMetricMetricIdPathResponse400> Unauthorized / Invalid
   */
  getMetricMetric_id_path(metadata: types.GetMetricMetricIdPathMetadataParam): Promise<FetchResponse<200, types.GetMetricMetricIdPathResponse200>> {
    return this.core.fetch('/metric/{metric_id_path}', 'get', metadata);
  }

  /**
   * Update progress of an individual metric. If you do not include the `metric_data_id`
   * parameter, the value will be applied to the most recent update date according to the
   * metric update frequency set in WorkBoard.
   *
   * @summary Update metric information
   * @throws FetchError<400, types.PutMetricMetricIdPathResponse400> Unauthorized / Invalid
   */
  putMetricMetric_id_path(body: types.PutMetricMetricIdPathBodyParam, metadata: types.PutMetricMetricIdPathMetadataParam): Promise<FetchResponse<200, types.PutMetricMetricIdPathResponse200>> {
    return this.core.fetch('/metric/{metric_id_path}', 'put', body, metadata);
  }

  /**
   * Update the confidence score and comment on a metric. The confidence_score values map to:
   * 0 = No Rating, 1 = Low, 2 = Medium, 3 = High.
   *
   * This would appear as a separate confidence update in the Metric history and not a
   * progress update with a confidence update.
   *
   * **Note:** The metric must be in an active state. Attempting to update confidence on a
   * deleted metric will result in a 500 error with the message "deleted_metric".
   *
   * @summary Update the confidence score (RAG) of a metric (key result)
   * @throws FetchError<400, types.PutMetricMetricIdPathConfidenceResponse400> Unauthorized / Invalid
   * @throws FetchError<500, types.PutMetricMetricIdPathConfidenceResponse500> The metric has been deleted and cannot be updated.
   */
  putMetricMetric_id_pathConfidence(body: types.PutMetricMetricIdPathConfidenceBodyParam, metadata: types.PutMetricMetricIdPathConfidenceMetadataParam): Promise<FetchResponse<200, types.PutMetricMetricIdPathConfidenceResponse200>> {
    return this.core.fetch('/metric/{metric_id_path}/confidence', 'put', body, metadata);
  }

  /**
   * Returns all tags mapped to the given metric in the system.
   *
   * @throws FetchError<400, types.GetMetricMetricIdPathTagsResponse400> Unauthorized / Invalid
   */
  getMetricMetric_id_pathTags(metadata: types.GetMetricMetricIdPathTagsMetadataParam): Promise<FetchResponse<200, types.GetMetricMetricIdPathTagsResponse200>> {
    return this.core.fetch('/metric/{metric_id_path}/tags', 'get', metadata);
  }

  /**
   * Add multiple tags to the given metric. Maximum tag list allowed is 50 per request. Only
   * valid tags will be considered.
   *
   * @throws FetchError<400, types.PutMetricMetricIdPathTagsResponse400> Unauthorized / Invalid
   */
  putMetricMetric_id_pathTags(body: types.PutMetricMetricIdPathTagsBodyParam, metadata: types.PutMetricMetricIdPathTagsMetadataParam): Promise<FetchResponse<200, types.PutMetricMetricIdPathTagsResponse200>>;
  putMetricMetric_id_pathTags(metadata: types.PutMetricMetricIdPathTagsMetadataParam): Promise<FetchResponse<200, types.PutMetricMetricIdPathTagsResponse200>>;
  putMetricMetric_id_pathTags(body?: types.PutMetricMetricIdPathTagsBodyParam | types.PutMetricMetricIdPathTagsMetadataParam, metadata?: types.PutMetricMetricIdPathTagsMetadataParam): Promise<FetchResponse<200, types.PutMetricMetricIdPathTagsResponse200>> {
    return this.core.fetch('/metric/{metric_id_path}/tags', 'put', body, metadata);
  }

  /**
   * Delete given tag lists mapped to the metric.
   *
   * @throws FetchError<400, types.DeleteMetricMetricIdPathTagsResponse400> Unauthorized / Invalid
   */
  deleteMetricMetric_id_pathTags(body: types.DeleteMetricMetricIdPathTagsBodyParam, metadata: types.DeleteMetricMetricIdPathTagsMetadataParam): Promise<FetchResponse<200, types.DeleteMetricMetricIdPathTagsResponse200>> {
    return this.core.fetch('/metric/{metric_id_path}/tags', 'delete', body, metadata);
  }

  /**
   * Returns all key result tags mapped to the given metrics in the system.
   *
   * @throws FetchError<400, types.GetMetricKrtagsResponse400> Unauthorized / Invalid
   */
  getMetricKrtags(metadata: types.GetMetricKrtagsMetadataParam): Promise<FetchResponse<200, types.GetMetricKrtagsResponse200>> {
    return this.core.fetch('/metric/krtags', 'get', metadata);
  }

  /**
   * Returns all metrics mapped to the given `tag_id`.
   *
   * @throws FetchError<400, types.GetMetricTagsResponse400> Unauthorized / Invalid
   */
  getMetricTags(metadata: types.GetMetricTagsMetadataParam): Promise<FetchResponse<200, types.GetMetricTagsResponse200>> {
    return this.core.fetch('/metric/tags', 'get', metadata);
  }

  /**
   * Add multiple tags to multiple metrics. Maximum tag list allowed is 50 per request. Only
   * valid tags will be considered.
   *
   * @throws FetchError<400, types.PostMetricTagsResponse400> Unauthorized / Invalid
   */
  postMetricTags(body?: types.PostMetricTagsBodyParam): Promise<FetchResponse<200, types.PostMetricTagsResponse200>> {
    return this.core.fetch('/metric/tags', 'post', body);
  }

  /**
   * Returns all key result tags in the system and allows for filtering tags by parameters.
   *
   * @throws FetchError<400, types.GetTagsResponse400> Unauthorized / Invalid
   */
  getTags(metadata?: types.GetTagsMetadataParam): Promise<FetchResponse<200, types.GetTagsResponse200>> {
    return this.core.fetch('/tags', 'get', metadata);
  }

  /**
   * Returns the specified key result tag.
   *
   * @throws FetchError<400, types.GetTagsTagIdPathResponse400> Unauthorized / Invalid
   */
  getTagsTag_id_path(metadata: types.GetTagsTagIdPathMetadataParam): Promise<FetchResponse<200, types.GetTagsTagIdPathResponse200>> {
    return this.core.fetch('/tags/{tag_id_path}', 'get', metadata);
  }

  /**
   * List the details of existing action items. By default, this query will return the first
   * 50 items that match your request parameters. Use the offset and limit parameters to
   * return a different set.
   *
   * @summary List the details of existing action items. By default, this query will return the first
   * 50 items that match your request parameters. Use the offset and limit parameters to
   * return a different set.
   * @throws FetchError<400, types.GetActivityResponse400> Unauthorized / Invalid
   */
  getActivity(metadata?: types.GetActivityMetadataParam): Promise<FetchResponse<200, types.GetActivityResponse200>> {
    return this.core.fetch('/activity', 'get', metadata);
  }

  /**
   * Create a new action item. Request parameters should be passed in the POST request or in
   * the payload (as JSON). To create an action item with a comment, sub-action, or tag, it
   * should be passed as raw JSON, along with the ai_id either as a request parameter or in
   * the URL.
   *
   * @summary Create an action item.
   * @throws FetchError<400, types.PostActivityResponse400> Unauthorized / Invalid
   */
  postActivity(body: types.PostActivityBodyParam): Promise<FetchResponse<200, types.PostActivityResponse200>> {
    return this.core.fetch('/activity', 'post', body);
  }

  /**
   * List the details of existing action items. By default, this query will return the first
   * 50 items that match your request parameters. Use the offset and limit parameters to
   * return a different set.
   *
   * @summary List the details of existing action items. By default, this query will return the first
   * 50 items that match your request parameters. Use the offset and limit parameters to
   * return a different set.
   * @throws FetchError<400, types.GetActivityAiIdPathResponse400> Unauthorized / Invalid
   */
  getActivityAi_id_path(metadata: types.GetActivityAiIdPathMetadataParam): Promise<FetchResponse<200, types.GetActivityAiIdPathResponse200>> {
    return this.core.fetch('/activity/{ai_id_path}', 'get', metadata);
  }

  /**
   * Update an existing action item. Request parameters should be passed in the payload (as
   * JSON). Note that the ai_id parameter is required.<br/>To update an action item with a
   * comment, sub-action, or tag, it should be passed as raw JSON, along with the `ai_id`
   * either as a request parameter or in the URL.
   *
   * @summary Update an activity.
   * @throws FetchError<400, types.PutActivityAiIdPathResponse400> Unauthorized / Invalid
   */
  putActivityAi_id_path(body: types.PutActivityAiIdPathBodyParam, metadata: types.PutActivityAiIdPathMetadataParam): Promise<FetchResponse<200, types.PutActivityAiIdPathResponse200>>;
  putActivityAi_id_path(metadata: types.PutActivityAiIdPathMetadataParam): Promise<FetchResponse<200, types.PutActivityAiIdPathResponse200>>;
  putActivityAi_id_path(body?: types.PutActivityAiIdPathBodyParam | types.PutActivityAiIdPathMetadataParam, metadata?: types.PutActivityAiIdPathMetadataParam): Promise<FetchResponse<200, types.PutActivityAiIdPathResponse200>> {
    return this.core.fetch('/activity/{ai_id_path}', 'put', body, metadata);
  }

  /**
   * <strong>Note:</strong><br/>The use of a `Data-Admin` token will not return all
   * Workstreams for all users.<br/>If no query string parameters are set, this will return
   * Team Workstreams for Teams which the authenticated user (token user) is a member of.
   * Personal Workstreams are not returned in the response.
   *
   * @summary Get the details of Team Workstreams to which the authenticated user (token user) has
   * access.
   * @throws FetchError<400, types.GetWorkstreamResponse400> Unauthorized / Invalid
   */
  getWorkstream(metadata?: types.GetWorkstreamMetadataParam): Promise<FetchResponse<200, types.GetWorkstreamResponse200>> {
    return this.core.fetch('/workstream', 'get', metadata);
  }

  /**
   * Create a new Workstream for a team, including a descriptive narrative and Workstream
   * owner. You have to manage or co-manage this team, including Data-Admin token users.
   *
   * @summary Create a Workstream for a team.
   * @throws FetchError<400, types.PostWorkstreamResponse400> Unauthorized / Invalid
   */
  postWorkstream(body?: types.PostWorkstreamBodyParam): Promise<FetchResponse<200, types.PostWorkstreamResponse200>> {
    return this.core.fetch('/workstream', 'post', body);
  }

  /**
   * Update a new Workstream for a team, including a descriptive narrative and Workstream
   * owner. You have to manage or co-manage this team, including Data-Admin token users.
   *
   * @summary Update a Workstream for a team.
   * @throws FetchError<400, types.PutWorkstreamWsIdPathResponse400> Unauthorized / Invalid
   */
  putWorkstreamWs_id_path(body: types.PutWorkstreamWsIdPathBodyParam, metadata: types.PutWorkstreamWsIdPathMetadataParam): Promise<FetchResponse<200, types.PutWorkstreamWsIdPathResponse200>>;
  putWorkstreamWs_id_path(metadata: types.PutWorkstreamWsIdPathMetadataParam): Promise<FetchResponse<200, types.PutWorkstreamWsIdPathResponse200>>;
  putWorkstreamWs_id_path(body?: types.PutWorkstreamWsIdPathBodyParam | types.PutWorkstreamWsIdPathMetadataParam, metadata?: types.PutWorkstreamWsIdPathMetadataParam): Promise<FetchResponse<200, types.PutWorkstreamWsIdPathResponse200>> {
    return this.core.fetch('/workstream/{ws_id_path}', 'put', body, metadata);
  }

  /**
   * Delete a Workstream with all its action items. A successful request will return a 204
   * code.
   *
   * @summary Delete a Workstream with all its action items. A successful request will return a 204
   * code.
   * @throws FetchError<400, types.PatchWorkstreamWsIdPathResponse400> Unauthorized / Invalid
   */
  patchWorkstreamWs_id_path(metadata: types.PatchWorkstreamWsIdPathMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/workstream/{ws_id_path}', 'patch', metadata);
  }

  /**
   * List details of all action items belonging to the specified Workstream.
   * <br/><strong>Note:</strong> This will only return Workstreams the user has access to.
   *
   * @summary List details of all action items belonging to the specified Workstream.
   * @throws FetchError<400, types.GetWorkstreamWsIdPathActivityResponse400> Unauthorized / Invalid
   */
  getWorkstreamWs_id_pathActivity(metadata: types.GetWorkstreamWsIdPathActivityMetadataParam): Promise<FetchResponse<200, types.GetWorkstreamWsIdPathActivityResponse200>> {
    return this.core.fetch('/workstream/{ws_id_path}/activity', 'get', metadata);
  }

  /**
   * Get the details of datastreams to which the authenticated user has access.
   *
   * @throws FetchError<400, types.GetStreamResponse400> Unauthorized / Invalid
   */
  getStream(): Promise<FetchResponse<200, types.GetStreamResponse200>> {
    return this.core.fetch('/stream', 'get');
  }

  /**
   * Create a datastream.
   *
   * @throws FetchError<400, types.PostStreamResponse400> Unauthorized / Invalid
   */
  postStream(body?: types.PostStreamBodyParam): Promise<FetchResponse<200, types.PostStreamResponse200>> {
    return this.core.fetch('/stream', 'post', body);
  }

  /**
   * Update the value(s) in your datastream.
   *
   * @throws FetchError<400, types.PostStreamStreamIdResponse400> Unauthorized / Invalid
   */
  postStreamStream_id(body: types.PostStreamStreamIdBodyParam, metadata: types.PostStreamStreamIdMetadataParam): Promise<FetchResponse<200, types.PostStreamStreamIdResponse200>> {
    return this.core.fetch('/stream/{stream_id}', 'post', body, metadata);
  }

  /**
   * WorkBoard's webhooks allow you to post data from your external applications into
   * WorkBoard by sending a formatted JSON payload via HTTP POST request to the secret
   * WorkBoard URL generated for your application. Currently WorkBoard only supports incoming
   * webhooks; outgoing webhooks will be available soon. <p>WorkBoard's incoming webhooks
   * offer an easy way to update metric data in WorkBoard using a simple HTTP post.</p>
   * <p>For more advanced applications which you can customize per your requirements, you can
   * code your own POST requests using the global hook URL which WorkBoard will generate for
   * you.</p> <p>**[Click here](https://www.myworkboard.com/wb/user/profile/edit?do=mgApp)**
   * to get your webhook URL.</p><p>Note: If you haven't yet tried one of our pre-built
   * connectors, you will first need to click one of the three options (Google Spreadsheet,
   * Microsoft Excel, or From CSV) to generate your private `webhook_hash`.</p>
   *
   * @summary Update progress on Metrics using webhooks.
   * @throws FetchError<400, types.PostHookWebhookHashResponse400> Unauthorized / Invalid
   */
  postHookWebhook_hash(body: types.PostHookWebhookHashBodyParam, metadata: types.PostHookWebhookHashMetadataParam): Promise<FetchResponse<200, types.PostHookWebhookHashResponse200>> {
    return this.core.fetch('/hook/{webhook_hash}', 'post', body, metadata);
  }
}

const createSDK = (() => { return new SDK(); })()
;

export default createSDK;

export type { DeleteMetricMetricIdPathTagsBodyParam, DeleteMetricMetricIdPathTagsMetadataParam, DeleteMetricMetricIdPathTagsResponse200, DeleteMetricMetricIdPathTagsResponse400, GetActivityAiIdPathMetadataParam, GetActivityAiIdPathResponse200, GetActivityAiIdPathResponse400, GetActivityMetadataParam, GetActivityResponse200, GetActivityResponse400, GetGoalGoalIdPathAlignmentMetadataParam, GetGoalGoalIdPathAlignmentResponse200, GetGoalGoalIdPathAlignmentResponse400, GetGoalGoalIdPathMetadataParam, GetGoalGoalIdPathMetricMetricIdPathMetadataParam, GetGoalGoalIdPathMetricMetricIdPathResponse200, GetGoalGoalIdPathMetricMetricIdPathResponse400, GetGoalGoalIdPathPillarsMetadataParam, GetGoalGoalIdPathPillarsResponse200, GetGoalGoalIdPathPillarsResponse400, GetGoalGoalIdPathResponse200, GetGoalGoalIdPathResponse400, GetGoalMetadataParam, GetGoalResponse200, GetGoalResponse400, GetMetricKrtagsMetadataParam, GetMetricKrtagsResponse200, GetMetricKrtagsResponse400, GetMetricMetadataParam, GetMetricMetricIdPathMetadataParam, GetMetricMetricIdPathResponse200, GetMetricMetricIdPathResponse400, GetMetricMetricIdPathTagsMetadataParam, GetMetricMetricIdPathTagsResponse200, GetMetricMetricIdPathTagsResponse400, GetMetricResponse200, GetMetricResponse400, GetMetricTagsMetadataParam, GetMetricTagsResponse200, GetMetricTagsResponse400, GetStreamResponse200, GetStreamResponse400, GetTagsMetadataParam, GetTagsResponse200, GetTagsResponse400, GetTagsTagIdPathMetadataParam, GetTagsTagIdPathResponse200, GetTagsTagIdPathResponse400, GetTeamMetadataParam, GetTeamResponse200, GetTeamResponse400, GetTeamTeamIdPathActivityMetadataParam, GetTeamTeamIdPathActivityResponse200, GetTeamTeamIdPathActivityResponse400, GetTeamTeamIdPathMetadataParam, GetTeamTeamIdPathResponse200, GetTeamTeamIdPathResponse400, GetTeamTeamIdPathWorkstreamMetadataParam, GetTeamTeamIdPathWorkstreamResponse200, GetTeamTeamIdPathWorkstreamResponse400, GetUserMetadataParam, GetUserResponse200, GetUserResponse400, GetUserResponse409, GetUserUserIdPathGoalGoalIdPathMetadataParam, GetUserUserIdPathGoalGoalIdPathResponse200, GetUserUserIdPathGoalGoalIdPathResponse400, GetUserUserIdPathGoalMetadataParam, GetUserUserIdPathGoalResponse200, GetUserUserIdPathGoalResponse400, GetUserUserIdPathMetadataParam, GetUserUserIdPathResponse200, GetUserUserIdPathResponse400, GetWorkstreamMetadataParam, GetWorkstreamResponse200, GetWorkstreamResponse400, GetWorkstreamWsIdPathActivityMetadataParam, GetWorkstreamWsIdPathActivityResponse200, GetWorkstreamWsIdPathActivityResponse400, PatchTeamMetadataParam, PatchTeamResponse400, PatchUserBodyParam, PatchUserMetadataParam, PatchUserResponse400, PatchWorkstreamWsIdPathMetadataParam, PatchWorkstreamWsIdPathResponse400, PostActivityBodyParam, PostActivityResponse200, PostActivityResponse400, PostGoalBodyParam, PostGoalResponse200, PostGoalResponse400, PostHookWebhookHashBodyParam, PostHookWebhookHashMetadataParam, PostHookWebhookHashResponse200, PostHookWebhookHashResponse400, PostMetricTagsBodyParam, PostMetricTagsResponse200, PostMetricTagsResponse400, PostStreamBodyParam, PostStreamResponse200, PostStreamResponse400, PostStreamStreamIdBodyParam, PostStreamStreamIdMetadataParam, PostStreamStreamIdResponse200, PostStreamStreamIdResponse400, PostTeamBodyParam, PostTeamResponse200, PostTeamResponse400, PostUserBodyParam, PostUserResponse200, PostUserResponse400, PostUserResponse409, PostWorkstreamBodyParam, PostWorkstreamResponse200, PostWorkstreamResponse400, PutActivityAiIdPathBodyParam, PutActivityAiIdPathMetadataParam, PutActivityAiIdPathResponse200, PutActivityAiIdPathResponse400, PutMetricMetricIdPathBodyParam, PutMetricMetricIdPathConfidenceBodyParam, PutMetricMetricIdPathConfidenceMetadataParam, PutMetricMetricIdPathConfidenceResponse200, PutMetricMetricIdPathConfidenceResponse400, PutMetricMetricIdPathConfidenceResponse500, PutMetricMetricIdPathMetadataParam, PutMetricMetricIdPathResponse200, PutMetricMetricIdPathResponse400, PutMetricMetricIdPathTagsBodyParam, PutMetricMetricIdPathTagsMetadataParam, PutMetricMetricIdPathTagsResponse200, PutMetricMetricIdPathTagsResponse400, PutTeamTeamIdPathBodyParam, PutTeamTeamIdPathMetadataParam, PutTeamTeamIdPathResponse200, PutTeamTeamIdPathResponse400, PutUserUserIdPathBodyParam, PutUserUserIdPathMetadataParam, PutUserUserIdPathResponse200, PutUserUserIdPathResponse400, PutUserUserIdPathResponse409, PutWorkstreamWsIdPathBodyParam, PutWorkstreamWsIdPathMetadataParam, PutWorkstreamWsIdPathResponse200, PutWorkstreamWsIdPathResponse400 } from './types';
