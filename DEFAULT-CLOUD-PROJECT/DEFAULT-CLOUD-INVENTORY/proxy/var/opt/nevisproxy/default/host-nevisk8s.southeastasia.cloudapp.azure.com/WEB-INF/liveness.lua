function inputHeader(req, resp)
	resp:setHeader("Content-Type", "application/json")
	resp:setBody("{ \"status\" : \"UP\" }")
	resp:send(200)
end