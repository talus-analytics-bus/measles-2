from behave import given, when, then
import requests


@given('I am looking at Infrastructure in Harris County, TX')
def step_given_infra(context):
    context.impact_type = 'infra'
    context.url = 'http://localhost:5001/impacts/'


@given('I am looking at Populations in Harris County, TX')
def step_given_pop(context):
    context.impact_type = 'pop'
    context.url = 'http://localhost:5001/impacts/population'


@when('I retrieve the impact for "{item}" at "{interval}"')
def step_when_get_impact(context, item, interval):
    if context.impact_type == 'infra':
        context.url = context.url + item
        context.res = requests.get(context.url)
    elif context.impact_type == 'pop':
        payload = {'regionId': ['48201'], 'ri': [interval]}
        context.pop = item
        context.res = requests.get(context.url, params=payload)
    context.ri = interval


@then("I should get a '200' response")
def step_then_200(context):
    print(context.res.status_code)
    assert context.res.status_code == 200


@then('the pop impact returned is "{depth}", "{people}", "{percent}"')
def step_then_pop_impact_values(context, depth, people, percent):
    res_json = context.res.json()

    for pop_info in res_json['data']:
        if pop_info['population_name'] == context.pop:
            # assert pop_info['avg_depth'] == depth
            assert int(pop_info['num_people_flooded']) == int(people)
            assert int(pop_info['pct_people_flooded'] * 100) == int(float(percent) * 100)


@then('the infra impact returned is "{type}", "{damage_level}", "{depth}"')
def step_then_infra_impact_values(context, type, damage_level, depth):
    res_json = context.res.json()

    for ri_info in res_json['data']:
        print(ri_info)
        if ri_info['ri'] == context.ri:
            assert ri_info['category'] == type
            assert ri_info['damage_level'] == damage_level
            assert ri_info['depth'] == depth
