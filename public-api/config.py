##
# # API configuration file.
##

# Standard libraries
# import sys

# Third party libraries
from configparser import ConfigParser
from argparse import ArgumentParser
from sqlalchemy import create_engine
# from sqlalchemy.exc import OperationalError
import pprint


# Config class, instantiated in api/setup.py.
class Config:
    def __init__(self, config_file):

        # Create a new config parser and read the config file passed to Config
        # instance.
        cfg = ConfigParser()
        cfg.read(config_file)

        # Define command line  arguments.
        self.clargs = self.collect_arguments()

        # Populate session config variables with defaults, to be potentially
        # overidden by command line arguments.
        cfg['session'] = {}
        for key in cfg['DEFAULT']:
            print('key = ' + key)
            cfg['session'][key] = cfg['DEFAULT'][key]


        # Define the current database session based on command line arguments,
        # if they were provided
        # TODO make this more legible.
        for k, v in vars(self.clargs).items():
            if v is not None:
                if k.startswith('pg_'):
                    cfg['session'][k.split('_')[1]] = str(v)
                else:
                    cfg['session'][k] = str(v)

        # Define parameters for database connection, if available.
        # TODO make this more legible.
        self.db = {k: v
                   for k, v in dict(cfg['session']).items()
                   if k not in ['datadir']}

        # Convert type of 'port' to integer
        print(self.db)
        self.db['port'] = int(self.db['port'])

        # Define database engine based on db connection parameters.
        self.engine = create_engine(f"postgresql+psycopg2://{self.db['user']}:{self.db['password']}@{self.db['host']}:{self.db['port']}/{self.db['dbname']}",
                                    use_batch_mode=True)

        # Debug mode is not used.
        self.debug = False

        # # Test the database connection. If it fails, quit.
        # try:
        #     self.engine.connect()
        #     print('Connected to database')
        # except OperationalError:
        #     print('Failed to connect to database')
        #     sys.exit(1)

    # Instance methods
    # To string
    def __str__(self):
        return pprint.pformat(self.__dict__)

    # Get item from config file (basically, a key-value pair)
    def __getitem__(self, key):
        return self.__dict__[key]

    # Set item from config file
    def __setitem__(self, key, value):
        self.__dict__[key] = value

    # Define argument parser to collect command line arguments from the user,
    # if provided.
    @staticmethod
    def collect_arguments():
        parser = ArgumentParser(description='Test', add_help=False)
        parser.add_argument('-h', '--pg-host')
        parser.add_argument('-p', '--pg-port', type=int)
        parser.add_argument('-d', '--pg-dbname')
        parser.add_argument('-u', '--pg-user')
        parser.add_argument('-w', '--pg-password')
        parser.add_argument('--help', action='help', help="""Please check the file config.py
                            for a list of command line arguments.""")

        return parser.parse_args()
