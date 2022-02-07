def redirect(location) {
    outargs.put('nevis.transfer.type', 'redirect')
    outargs.put('nevis.transfer.destination', location)
}

// ServiceProviderState is not a finisher
// thus the redirect location is stored in the session and the redirect is done here
def cr = session.get('cached-redirect')
if (cr != null) {
    LOG.debug("redirecting to $cr according to cached-redirect")
    session.remove('cached-redirect')
    redirect(cr)
}

// nevisProxy replaces the entire AUTH: scope when new outargs are returned.
// we therefore have to store tokens in the session and return them again for subsequent stepups.
session.putIfAbsent('outarg.tokens', [:])
def tokens = session.get('outarg.tokens')

// restoring tokens:
tokens.each { name, value ->
    if (outargs.containsKey(name)) {
        LOG.debug("not restoring token (outarg: $name) from session: outarg already set")
    }
    else {
        LOG.debug("restoring token (outarg: $name) from session")
        outargs.put(name, value)
    }
}

// remember tokens:
outargs.each { name, value ->
    if (name.startsWith('token.')) {
        tokens.put(name, value)
    }
}