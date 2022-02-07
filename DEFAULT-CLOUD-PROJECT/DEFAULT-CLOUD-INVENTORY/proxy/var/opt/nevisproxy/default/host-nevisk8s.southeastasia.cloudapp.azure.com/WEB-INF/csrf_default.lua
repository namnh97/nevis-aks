function contains(tab, val)
    for index, value in ipairs(tab) do
        if value == val then
            return true
        end
    end
    return false
end

function inputHeader(request, response)

  if (request:getMethod() == "GET" or request:getMethod() == "HEAD" or request:getMethod() == "OPTIONS" or request:getMethod() == "TRACE") then
    -- these requests are not sensitive (do not manipulate state) and are thus not checked
    return
  end

  -- patterns sets allowed domains or {}
  domains = {}

  host = request:getHeader("Host")

  if (host == nil) then
    -- Internet-based HTTP/1.1 servers MUST respond with a 400 (Bad Request) status code to any HTTP/1.1 request message which lacks a Host header field.
    request:getTracer():notice("VA05", "Missing Host header")
    response:setHeader("Content-Type", "text/plain")
    response:setBody("400 Bad Request")
    response:send(400)
    return
  end

  -- extract host name
  host = host:match('([^:]+)')

  referer = request:getHeader("Referer")
  if (referer ~= nil) then
    referer = referer:match('^%w+://([^/:]+)')
    if (referer ~= host and not contains(domains, referer)) then
        if (referer ~= nil) then
            request:getTracer():notice("VA01", "HTTP Referer header " .. referer .. " does not match host " .. host)
        else
            request:getTracer():notice("VA01", "HTTP Referer header " .. request:getHeader("Referer") .. " does not match pattern '^[a-zA-Z0-9]+://([^/:]+)'")
        end
        response:setHeader("Content-Type", "text/plain")
        response:setBody("403 Denied")
        response:send(403)
        return
    end
  end

  origin = request:getHeader("Origin")
  if (origin ~= nil) then
    origin = origin:match('^%w+://([^/:]+)')
    if (origin ~= host and not contains(domains, origin)) then
        if (origin ~= nil) then
            request:getTracer():notice("VA01", "HTTP Origin header " .. origin .. " does not match host " .. host)
        else
            request:getTracer():notice("VA01", "HTTP Origin header " .. request:getHeader("Origin") .. " does not match pattern '^[a-zA-Z0-9]+://([^/:]+)'")
        end
        response:setHeader("Content-Type", "text/plain")
        response:setBody("403 Denied")
        response:send(403)
        return
    end
  end

  if (origin == nil and referer == nil) then
    request:getTracer():info("VA05", "Referer or Origin header is required for sensitive requests")
    response:setHeader("Content-Type", "text/plain")
    response:setBody("403 Denied")
    response:send(403)
    return
  end
end