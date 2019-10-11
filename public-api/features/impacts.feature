Feature: 
	Scenario Outline: Metric Catalog
		Given I am looking at Populations in Harris County, TX
    When I retrieve the impact for "<item>" at "<interval>"
		Then I should get a '200' response
		And the pop impact returned is "<depth>", "<people>", "<percent>"

    Examples: Populations
    | item                                      | interval | depth | people  | percent |
    | Total population                          | 500      | high  | 1600156 | 0.36    |
