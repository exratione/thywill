/**
 * @fileOverview
 * A script to tell one of the clustered Thywill server processes running the
 * Draw example application to prepare for shutdown.
 */

require("../lib/service").prepareForShutdown("delta");
